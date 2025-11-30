import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Resend token email to user
    Args: event - dict with token and email in body
          context - object with request_id
    Returns: HTTP response with status
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
    
    token = body_data.get('token')
    email = body_data.get('email')
    
    if not token or not email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Token and email are required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            safe_token = token.replace("'", "''")
            cur.execute(
                f"SELECT plan, expires_at FROM t_p8566807_chat_access_project.subscriptions WHERE user_token = '{safe_token}'"
            )
            subscription = cur.fetchone()
            
            if not subscription:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Subscription not found'})
                }
            
            safe_email = email.replace("'", "''")
            cur.execute(
                f"UPDATE t_p8566807_chat_access_project.subscriptions SET email = '{safe_email}' WHERE user_token = '{safe_token}'"
            )
            conn.commit()
            
            plan = subscription['plan']
            expires_at = subscription['expires_at']
            
            chat_url = 'https://chat-bankrot.ru'
            plan_name = 'неделю' if plan == 'week' else 'месяц'
            
            if isinstance(expires_at, str):
                expires_date = datetime.fromisoformat(expires_at).strftime('%d.%m.%Y')
            else:
                expires_date = expires_at.strftime('%d.%m.%Y')
            
            smtp_email = os.environ.get('SMTP_EMAIL', 'bankrotkurs@yandex.ru')
            smtp_password = os.environ.get('SMTP_PASSWORD')
            
            if not smtp_password:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'SMTP not configured'})
                }
            
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
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'status': 'ok',
                    'message': f'Email sent to {email}',
                    'expires_at': expires_date
                })
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        conn.close()
