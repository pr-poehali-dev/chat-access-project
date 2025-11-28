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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Payment processing with YooKassa (Yandex Checkout) integration
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id
    Returns: HTTP response with payment URL or webhook confirmation
    Version: 1.2
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
    
    shop_id = os.environ.get('YOOKASSA_SHOP_ID') or '1199395'
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY') or 'live_e4dd0LrHUUDgMMmejZmZ617k6RjilkZZnkgARRTU_Pk'
    dsn = os.environ.get('DATABASE_URL')
    
    if False:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'YooKassa credentials not configured. Please contact administrator.',
                'details': f'shop_id: {bool(shop_id)}, secret_key: {bool(secret_key)}'
            })
        }
    
    if method == 'POST':
        body_str = event.get('body') or '{}'
        if body_str.strip() == '':
            body_str = '{}'
        body_data = json.loads(body_str)
        
        if 'object' in body_data and body_data.get('event') == 'payment.succeeded':
            payment_obj = body_data['object']
            payment_id = payment_obj['id']
            metadata = payment_obj.get('metadata', {})
            invoice_id = metadata.get('invoice_id')
            plan = metadata.get('plan')
            
            email = None
            receipt = payment_obj.get('receipt', {})
            if receipt:
                email = receipt.get('email') or receipt.get('customer', {}).get('email')
            
            if not email:
                email = payment_obj.get('receipt_email') or payment_obj.get('metadata', {}).get('email')
            
            print(f"Webhook received: payment_id={payment_id}, invoice_id={invoice_id}, plan={plan}, email={email}")
            print(f"Full webhook data: {json.dumps(body_data, ensure_ascii=False)}")
            
            if not invoice_id or not plan:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'status': 'ok'})
                }
            
            conn = psycopg2.connect(dsn)
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    safe_invoice_id = invoice_id.replace("'", "''")
                    cur.execute(
                        f"SELECT status FROM t_p8566807_chat_access_project.payment_orders WHERE invoice_id = '{safe_invoice_id}'"
                    )
                    order = cur.fetchone()
                    
                    if order and order['status'] == 'pending':
                        token = secrets.token_urlsafe(32)
                        expires_at = datetime.now() + timedelta(days=7 if plan == 'week' else 30)
                        
                        safe_token = token.replace("'", "''")
                        safe_plan = plan.replace("'", "''")
                        safe_email = (email or '').replace("'", "''")
                        expires_str = expires_at.strftime('%Y-%m-%d %H:%M:%S')
                        
                        cur.execute(
                            f"INSERT INTO t_p8566807_chat_access_project.subscriptions (user_token, plan, expires_at, email) VALUES ('{safe_token}', '{safe_plan}', '{expires_str}', '{safe_email}')"
                        )
                        
                        cur.execute(
                            f"UPDATE t_p8566807_chat_access_project.payment_orders SET status = 'paid' WHERE invoice_id = '{safe_invoice_id}'"
                        )
                        
                        conn.commit()
                        
                        print(f"Creating subscription: token={token[:10]}..., email={email}, plan={plan}, expires={expires_at}")
                        
                        if email:
                            try:
                                chat_url = 'https://chat-bankrot.ru'
                                plan_name = 'неделю' if plan == 'week' else 'месяц'
                                expires_date = expires_at.strftime('%d.%m.%Y')
                                
                                smtp_email = os.environ.get('SMTP_EMAIL', 'bankrotkurs@yandex.ru')
                                smtp_password = os.environ.get('SMTP_PASSWORD')
                                
                                print(f"Preparing email to: {email}")
                                
                                msg = MIMEMultipart()
                                msg['From'] = smtp_email
                                msg['To'] = email
                                msg['Subject'] = 'Доступ к закрытому чату курса "Банкротство физических лиц"'
                                
                                email_body = f"""Здравствуйте!

Спасибо за оплату подписки на {plan_name}!

Ваш доступ к закрытому чату активирован до {expires_date}.

🔑 Ваш персональный токен доступа:
{token}

📱 Ссылка на чат:
{chat_url}

Инструкция по входу:
1. Перейдите по ссылке: {chat_url}
2. Нажмите "Войти с токеном"
3. Вставьте ваш токен доступа
4. Готово! Вы в чате

Важно:
- Сохраните этот токен - он понадобится для входа
- Токен действителен до {expires_date}
- Не передавайте токен другим людям

По всем вопросам пишите на bankrotkurs@yandex.ru

С уважением,
Команда курса "Банкротство физических лиц"
Валентина Голосова"""
                                
                                msg.attach(MIMEText(email_body, 'plain', 'utf-8'))
                                
                                with smtplib.SMTP('smtp.yandex.ru', 587) as server:
                                    server.starttls()
                                    server.login(smtp_email, smtp_password)
                                    server.send_message(msg)
                                    print(f"Email sent successfully to {email}")
                            except Exception as e:
                                print(f"Email sending failed: {e}")
                        else:
                            print("No email provided, skipping email sending")
            finally:
                conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'status': 'ok'})
            }
        
        plan = body_data.get('plan')
        email = body_data.get('email', 'customer@example.com')
        
        if plan not in ['week', 'month']:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid plan'})
            }
        
        amount = 1 if plan == 'week' else 2
        inv_id = secrets.token_urlsafe(16)
        description = f"Подписка на {'неделю' if plan == 'week' else 'месяц'}"
        
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                safe_inv_id = inv_id.replace("'", "''")
                safe_plan = plan.replace("'", "''")
                cur.execute(
                    f"INSERT INTO t_p8566807_chat_access_project.payment_orders (invoice_id, plan, amount, status) VALUES ('{safe_inv_id}', '{safe_plan}', {amount}, 'pending')"
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
            "receipt": {
                "customer": {
                    "email": email
                },
                "items": [
                    {
                        "description": description,
                        "quantity": "1",
                        "amount": {
                            "value": f"{amount}.00",
                            "currency": "RUB"
                        },
                        "vat_code": 1,
                        "payment_subject": "service",
                        "payment_mode": "full_payment"
                    }
                ]
            },
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
                'body': json.dumps({
                    'error': 'Payment creation failed', 
                    'details': error_body,
                    'http_code': e.code,
                    'shop_id_length': len(shop_id) if shop_id else 0
                }, ensure_ascii=False)
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Unexpected error',
                    'details': str(e)
                }, ensure_ascii=False)
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    }