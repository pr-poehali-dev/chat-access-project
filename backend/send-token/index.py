import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manually send access token to user email
    Args: event - dict with email and token in body
          context - object with request_id
    Returns: HTTP response with success/error
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
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_str = event.get('body', '{}')
    body_data = json.loads(body_str)
    
    email = body_data.get('email')
    token = body_data.get('token')
    plan = body_data.get('plan', 'week')
    expires_date = body_data.get('expires_date', '05.12.2025')
    
    if not email or not token:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Email and token are required'})
        }
    
    try:
        chat_url = 'https://chat-bankrot.ru'
        plan_name = 'неделю' if plan == 'week' else 'месяц'
        
        smtp_email = os.environ.get('SMTP_EMAIL', 'bankrotkurs@yandex.ru')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        
        if not smtp_password:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
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
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'status': 'ok', 'message': f'Email sent to {email}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
