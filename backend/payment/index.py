import json
import os
import hashlib
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import secrets

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Payment processing with Robokassa integration
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id
    Returns: HTTP response with payment URL or confirmation
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
    
    merchant_login = os.environ.get('ROBOKASSA_MERCHANT_LOGIN')
    password_1 = os.environ.get('ROBOKASSA_PASSWORD_1')
    password_2 = os.environ.get('ROBOKASSA_PASSWORD_2')
    dsn = os.environ.get('DATABASE_URL')
    
    if method == 'POST':
        body_str = event.get('body') or '{}'
        if body_str.strip() == '':
            body_str = '{}'
        body_data = json.loads(body_str)
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
        
        amount = 299 if plan == 'week' else 999
        inv_id = secrets.token_urlsafe(16)
        description = f"Подписка на {'неделю' if plan == 'week' else 'месяц'}"
        
        success_url = "https://functions.poehali.dev/b923c572-0638-4906-b3f4-6d26f0d2edfb"
        
        signature_string = f"{merchant_login}:{amount}:{inv_id}:{password_1}"
        signature = hashlib.md5(signature_string.encode()).hexdigest()
        
        from urllib.parse import quote
        payment_url = f"https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin={merchant_login}&OutSum={amount}&InvId={inv_id}&Description={quote(description)}&SignatureValue={signature}&SuccessURL={quote(success_url)}&IsTest=1"
        
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
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'payment_url': payment_url,
                'invoice_id': inv_id
            }, ensure_ascii=False)
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        out_sum = params.get('OutSum', '')
        inv_id = params.get('InvId', '')
        signature_value = params.get('SignatureValue', '')
        
        if not all([out_sum, inv_id, signature_value]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing parameters'})
            }
        
        expected_signature = hashlib.md5(f"{out_sum}:{inv_id}:{password_2}".encode()).hexdigest()
        
        if signature_value.lower() != expected_signature.lower():
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid signature'})
            }
        
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT plan FROM t_p8566807_chat_access_project.payment_orders WHERE invoice_id = %s AND status = %s",
                    (inv_id, 'pending')
                )
                order = cur.fetchone()
                
                if not order:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Order not found'})
                    }
                
                token = secrets.token_urlsafe(32)
                plan = order['plan']
                expires_at = datetime.now() + timedelta(days=7 if plan == 'week' else 30)
                
                cur.execute(
                    "INSERT INTO t_p8566807_chat_access_project.subscriptions (user_token, plan, expires_at) VALUES (%s, %s, %s)",
                    (token, plan, expires_at)
                )
                
                cur.execute(
                    "UPDATE t_p8566807_chat_access_project.payment_orders SET status = %s WHERE invoice_id = %s",
                    ('paid', inv_id)
                )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': f"OK{inv_id}"
                }
        finally:
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    }