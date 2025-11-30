import json
import os
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import Dict, Any
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manually create subscription and send token to user email
    Args: event - dict with email, plan in body
          context - object with request_id
    Returns: HTTP response with created token
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_str = event.get('body', '{}')
    body_data = json.loads(body_str)
    
    email = body_data.get('email')
    plan = body_data.get('plan', 'month')
    
    if not email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email is required'})
        }
    
    if plan not in ['week', 'month']:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid plan'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(days=7 if plan == 'week' else 30)
    
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            safe_token = token.replace("'", "''")
            safe_plan = plan.replace("'", "''")
            safe_email = email.replace("'", "''")
            expires_str = expires_at.strftime('%Y-%m-%d %H:%M:%S')
            
            cur.execute(
                f"INSERT INTO t_p8566807_chat_access_project.subscriptions (user_token, plan, expires_at, email, is_blocked) VALUES ('{safe_token}', '{safe_plan}', '{expires_str}', '{safe_email}', false)"
            )
            conn.commit()
            
            chat_url = 'https://chat-bankrot.ru'
            plan_name = 'неделю' if plan == 'week' else 'месяц'
            expires_date = expires_at.strftime('%d.%m.%Y')
            
            smtp_email = os.environ.get('SMTP_EMAIL', 'bankrotkurs@yandex.ru')
            smtp_password = os.environ.get('SMTP_PASSWORD')
            
            if smtp_password:
                try:
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
                    
                    email_sent = True
                except Exception as e:
                    print(f"Email sending failed: {e}")
                    email_sent = False
            else:
                email_sent = False
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'status': 'ok',
                    'token': token,
                    'expires_at': expires_str,
                    'email_sent': email_sent,
                    'email': email
                })
            }
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        conn.close()
