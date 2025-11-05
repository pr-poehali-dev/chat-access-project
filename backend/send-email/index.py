import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Send support form emails to melni-v@yandex.ru
    Args: event with httpMethod, body containing name, email, message
    Returns: HTTP response with success/error status
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
    
    body_data = json.loads(event.get('body', '{}'))
    name: str = body_data.get('name', '')
    user_email: str = body_data.get('email', '')
    message: str = body_data.get('message', '')
    
    if not all([name, user_email, message]):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Все поля обязательны'})
        }
    
    recipient = 'melni-v@yandex.ru'
    
    msg = MIMEMultipart()
    msg['From'] = user_email
    msg['To'] = recipient
    msg['Subject'] = f'Обращение в поддержку от {name}'
    
    email_body = f"""
Новое обращение в поддержку

От: {name}
Email: {user_email}

Сообщение:
{message}
    """
    
    msg.attach(MIMEText(email_body, 'plain', 'utf-8'))
    
    try:
        with smtplib.SMTP('smtp.yandex.ru', 587) as server:
            server.starttls()
            server.login('melni-v@yandex.ru', 'vxktzlglebdbwlti')
            server.send_message(msg)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': 'Сообщение отправлено'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка отправки: {str(e)}'})
        }
