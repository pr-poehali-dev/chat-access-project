import json
import os
import base64
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import secrets
import urllib.request
import urllib.error

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Payment processing with YooKassa (Yandex Checkout) integration
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id
    Returns: HTTP response with payment URL or webhook confirmation
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    shop_id = os.environ.get('YOOKASSA_SHOP_ID')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY')
    dsn = os.environ.get('DATABASE_URL')
    
    if method == 'POST':
        body_str = event.get('body') or '{}'
        if body_str.strip() == '':
            body_str = '{}'
        body_data = json.loads(body_str)
        
        if 'object' in body_data and body_data.get('event') == 'payment.succeeded':
            payment_id = body_data['object']['id']
            metadata = body_data['object'].get('metadata', {})
            invoice_id = metadata.get('invoice_id')
            plan = metadata.get('plan')
            receipt = body_data['object'].get('receipt', {})
            email = receipt.get('email') if receipt else None
            
            if not invoice_id or not plan:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'status': 'ok'})
                }
            
            conn = psycopg2.connect(dsn)
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "SELECT status FROM t_p8566807_chat_access_project.payment_orders WHERE invoice_id = %s",
                        (invoice_id,)
                    )
                    order = cur.fetchone()
                    
                    if order and order['status'] == 'pending':
                        token = secrets.token_urlsafe(32)
                        expires_at = datetime.now() + timedelta(days=7 if plan == 'week' else 30)
                        
                        cur.execute(
                            "INSERT INTO t_p8566807_chat_access_project.subscriptions (user_token, plan, expires_at, email) VALUES (%s, %s, %s, %s)",
                            (token, plan, expires_at, email)
                        )
                        
                        cur.execute(
                            "UPDATE t_p8566807_chat_access_project.payment_orders SET status = %s WHERE invoice_id = %s",
                            ('paid', invoice_id)
                        )
                        
                        conn.commit()
            finally:
                conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'status': 'ok'})
            }
        
        plan = body_data.get('plan')
        
        if plan not in ['week', 'month']:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid plan'})
            }
        
        amount = 999 if plan == 'week' else 3999
        inv_id = secrets.token_urlsafe(16)
        description = f"Подписка на {'неделю' if plan == 'week' else 'месяц'}"
        
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "INSERT INTO t_p8566807_chat_access_project.payment_orders (invoice_id, plan, amount, status) VALUES (%s, %s, %s, %s)",
                    (inv_id, plan, amount, 'pending')
                )
                conn.commit()
        finally:
            conn.close()
        
        idempotence_key = secrets.token_urlsafe(32)
        auth_string = f"{shop_id}:{secret_key}"
        auth_header = base64.b64encode(auth_string.encode()).decode()
        
        return_url = f"https://functions.poehali.dev/b923c572-0638-4906-b3f4-6d26f0d2edfb?InvId={inv_id}"
        
        payment_data = {
            "amount": {
                "value": f"{amount}.00",
                "currency": "RUB"
            },
            "confirmation": {
                "type": "redirect",
                "return_url": return_url
            },
            "capture": True,
            "description": description,
            "metadata": {
                "invoice_id": inv_id,
                "plan": plan
            }
        }
        
        try:
            req = urllib.request.Request(
                'https://api.yookassa.ru/v3/payments',
                data=json.dumps(payment_data).encode('utf-8'),
                headers={
                    'Authorization': f'Basic {auth_header}',
                    'Idempotence-Key': idempotence_key,
                    'Content-Type': 'application/json'
                }
            )
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                confirmation_url = result['confirmation']['confirmation_url']
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'payment_url': confirmation_url,
                        'invoice_id': inv_id
                    }, ensure_ascii=False)
                }
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Payment creation failed', 'details': error_body})
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    }