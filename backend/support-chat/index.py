import json
import os
from typing import Dict, Any, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def get_db_connection():
    """Создает соединение с базой данных"""
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def send_email_notification(client_email: str, message_text: str, ticket_id: int):
    """Отправляет email уведомление админу о новом сообщении"""
    smtp_email = os.environ.get('SMTP_EMAIL')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    admin_email = 'melni-v@yandex.ru'
    
    if not smtp_email or not smtp_password:
        return
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Новое сообщение в поддержке от {client_email}'
        msg['From'] = smtp_email
        msg['To'] = admin_email
        
        text = f'''Новое сообщение в поддержке!

От: {client_email}
Тикет: #{ticket_id}

Сообщение:
{message_text}

Ответить: https://app.bankrot-kurs.ru/admin/support
'''
        
        html = f'''<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }}
        .message {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }}
        .footer {{ text-align: center; padding: 15px; color: #666; font-size: 12px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }}
        .info {{ color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🔔 Новое сообщение в поддержке</h2>
        </div>
        <div class="content">
            <p class="info"><strong>От:</strong> {client_email}</p>
            <p class="info"><strong>Тикет:</strong> #{ticket_id}</p>
            <div class="message">
                <p><strong>Сообщение:</strong></p>
                <p>{message_text}</p>
            </div>
            <center>
                <a href="https://app.bankrot-kurs.ru/admin/support" class="button">Ответить клиенту</a>
            </center>
        </div>
        <div class="footer">
            <p>Это автоматическое уведомление от системы поддержки bankrot-kurs.ru</p>
        </div>
    </div>
</body>
</html>'''
        
        part1 = MIMEText(text, 'plain', 'utf-8')
        part2 = MIMEText(html, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)
        
        with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
            server.login(smtp_email, smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f'Ошибка отправки email: {e}')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для работы с чатом поддержки юристов.
    Поддерживает отправку сообщений, получение истории, добавление реакций.
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_email = headers.get('x-user-email') or headers.get('X-User-Email')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            # Получение тикетов или сообщений
            params = event.get('queryStringParameters') or {}
            action = params.get('action', 'get_messages')
            
            if action == 'get_tickets':
                # Получить все тикеты (для админа)
                cur.execute('''
                    SELECT t.*, 
                           COUNT(m.id) as message_count,
                           MAX(m.created_at) as last_message_time
                    FROM t_p8566807_chat_access_project.support_tickets t
                    LEFT JOIN t_p8566807_chat_access_project.support_messages m ON t.id = m.ticket_id
                    GROUP BY t.id
                    ORDER BY t.last_message_at DESC NULLS LAST, t.created_at DESC
                ''')
                tickets = [dict(row) for row in cur.fetchall()]
                
                # Преобразуем datetime в строки
                for ticket in tickets:
                    for key in ['created_at', 'updated_at', 'last_message_at', 'last_message_time']:
                        if ticket.get(key):
                            ticket[key] = ticket[key].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'tickets': tickets}),
                    'isBase64Encoded': False
                }
            
            elif action == 'get_messages':
                # Получить сообщения для конкретного тикета
                ticket_id = params.get('ticket_id')
                
                if not ticket_id:
                    # Если не указан ticket_id, найти или создать тикет для пользователя
                    if not user_email:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'User email required'}),
                            'isBase64Encoded': False
                        }
                    
                    # Найти существующий тикет
                    cur.execute('''
                        SELECT id FROM t_p8566807_chat_access_project.support_tickets
                        WHERE client_email = %s
                        ORDER BY created_at DESC LIMIT 1
                    ''', (user_email,))
                    
                    result = cur.fetchone()
                    if result:
                        ticket_id = result['id']
                    else:
                        # Создать новый тикет
                        cur.execute('''
                            INSERT INTO t_p8566807_chat_access_project.support_tickets 
                            (client_email, status)
                            VALUES (%s, 'open')
                            RETURNING id
                        ''', (user_email,))
                        ticket_id = cur.fetchone()['id']
                        conn.commit()
                
                # Получить сообщения
                cur.execute('''
                    SELECT m.*, 
                           COALESCE(json_agg(
                               json_build_object(
                                   'reaction', r.reaction,
                                   'user_email', r.user_email
                               )
                           ) FILTER (WHERE r.id IS NOT NULL), '[]') as reactions
                    FROM t_p8566807_chat_access_project.support_messages m
                    LEFT JOIN t_p8566807_chat_access_project.support_reactions r ON m.id = r.message_id
                    WHERE m.ticket_id = %s
                    GROUP BY m.id
                    ORDER BY m.created_at ASC
                ''', (ticket_id,))
                
                messages = [dict(row) for row in cur.fetchall()]
                
                # Преобразуем datetime в строки
                for msg in messages:
                    if msg.get('created_at'):
                        msg['created_at'] = msg['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'ticket_id': int(ticket_id), 'messages': messages}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'send_message':
                # Отправить сообщение
                ticket_id = body_data.get('ticket_id')
                message_text = body_data.get('message')
                attachment_url = body_data.get('attachment_url')
                sender_type = body_data.get('sender_type', 'client')
                
                if not ticket_id:
                    # Создать новый тикет
                    if not user_email:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'User email required'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute('''
                        INSERT INTO t_p8566807_chat_access_project.support_tickets 
                        (client_email, status)
                        VALUES (%s, 'open')
                        RETURNING id
                    ''', (user_email,))
                    ticket_id = cur.fetchone()['id']
                
                # Добавить сообщение
                cur.execute('''
                    INSERT INTO t_p8566807_chat_access_project.support_messages
                    (ticket_id, sender_type, sender_email, message_text, attachment_url)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, created_at
                ''', (ticket_id, sender_type, user_email, message_text, attachment_url))
                
                result = cur.fetchone()
                message_id = result['id']
                created_at = result['created_at'].isoformat()
                
                # Обновить время последнего сообщения в тикете
                cur.execute('''
                    UPDATE t_p8566807_chat_access_project.support_tickets
                    SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (ticket_id,))
                
                conn.commit()
                
                # Отправить email уведомление админу, если сообщение от клиента
                if sender_type == 'client' and user_email and message_text:
                    send_email_notification(user_email, message_text, ticket_id)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message_id': message_id,
                        'ticket_id': ticket_id,
                        'created_at': created_at
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'add_reaction':
                # Добавить реакцию на сообщение
                message_id = body_data.get('message_id')
                reaction = body_data.get('reaction')
                
                if not message_id or not reaction:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'message_id and reaction required'}),
                        'isBase64Encoded': False
                    }
                
                # Проверяем, есть ли уже такая реакция
                cur.execute('''
                    SELECT id FROM t_p8566807_chat_access_project.support_reactions
                    WHERE message_id = %s AND user_email = %s AND reaction = %s
                ''', (message_id, user_email, reaction))
                
                if cur.fetchone():
                    # Удалить реакцию (toggle)
                    cur.execute('''
                        DELETE FROM t_p8566807_chat_access_project.support_reactions
                        WHERE message_id = %s AND user_email = %s AND reaction = %s
                    ''', (message_id, user_email, reaction))
                else:
                    # Добавить реакцию
                    cur.execute('''
                        INSERT INTO t_p8566807_chat_access_project.support_reactions
                        (message_id, user_email, reaction)
                        VALUES (%s, %s, %s)
                    ''', (message_id, user_email, reaction))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            # Обновить статус тикета
            body_data = json.loads(event.get('body', '{}'))
            ticket_id = body_data.get('ticket_id')
            status = body_data.get('status')
            
            if not ticket_id or not status:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ticket_id and status required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                UPDATE t_p8566807_chat_access_project.support_tickets
                SET status = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (status, ticket_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()