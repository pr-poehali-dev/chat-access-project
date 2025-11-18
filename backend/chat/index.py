import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Chat API for anonymous messaging with subscription validation
    Args: event - dict with httpMethod, body, headers (X-User-Token)
          context - object with request_id
    Returns: HTTP response dict with messages or post confirmation
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_token = headers.get('X-User-Token') or headers.get('x-user-token')
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            if not user_token:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Token required'})
                }
            
            if user_token not in ['admin_forever_access_2024', 'ADMIN_TOKEN_ValentinaGolosova2024']:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "SELECT expires_at FROM subscriptions WHERE user_token = %s",
                        (user_token,)
                    )
                    sub = cur.fetchone()
                    
                    if not sub or sub['expires_at'] < datetime.now():
                        return {
                            'statusCode': 403,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Subscription expired or invalid'})
                        }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                
                is_admin = user_token in ['admin_forever_access_2024', 'ADMIN_TOKEN_ValentinaGolosova2024']
                
                if is_admin:
                    cur.execute(
                        "SELECT m.id, m.content, m.image_url, m.author_name, m.reply_to, m.created_at, m.is_pinned, m.edited_at, m.user_token, s.email FROM t_p8566807_chat_access_project.messages m LEFT JOIN t_p8566807_chat_access_project.subscriptions s ON m.user_token = s.user_token WHERE m.created_at >= NOW() - INTERVAL '24 hours' ORDER BY m.is_pinned DESC, m.created_at DESC"
                    )
                else:
                    cur.execute(
                        "SELECT id, content, image_url, author_name, reply_to, created_at, is_pinned, edited_at FROM t_p8566807_chat_access_project.messages WHERE created_at >= NOW() - INTERVAL '24 hours' ORDER BY is_pinned DESC, created_at DESC"
                    )
                messages = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'messages': [
                            {
                                'id': msg['id'],
                                'content': msg['content'],
                                'image_url': msg.get('image_url'),
                                'author_name': msg.get('author_name'),
                                'reply_to': msg['reply_to'],
                                'created_at': msg['created_at'].isoformat(),
                                'is_pinned': msg.get('is_pinned', False),
                                'edited_at': msg['edited_at'].isoformat() if msg.get('edited_at') else None,
                                'user_token': msg.get('user_token') if is_admin else None,
                                'email': msg.get('email') if is_admin else None
                            }
                            for msg in messages
                        ]
                    }, ensure_ascii=False)
                }
        
        if method == 'DELETE':
            if not user_token:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Token required'})
                }
            
            if user_token not in ['admin_forever_access_2024', 'ADMIN_TOKEN_ValentinaGolosova2024']:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Admin access required'})
                }
            
            query_params = event.get('queryStringParameters', {})
            message_id = query_params.get('id')
            
            if not message_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Message ID required'})
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                def delete_message_with_replies(msg_id):
                    cur.execute(
                        "SELECT id FROM t_p8566807_chat_access_project.messages WHERE reply_to = %s",
                        (msg_id,)
                    )
                    replies = cur.fetchall()
                    
                    for reply in replies:
                        delete_message_with_replies(reply['id'])
                    
                    cur.execute(
                        "DELETE FROM t_p8566807_chat_access_project.messages WHERE id = %s",
                        (msg_id,)
                    )
                
                delete_message_with_replies(message_id)
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True, 'deleted_id': int(message_id)}, ensure_ascii=False)
                }
        
        if method == 'POST':
            if not user_token:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Token required'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            content = body_data.get('content', '').strip()
            image_url = body_data.get('image_url')
            author_name = body_data.get('author_name', '').strip()[:100]
            reply_to = body_data.get('reply_to')
            
            if not content and not image_url:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Content required'})
                }
            
            if user_token not in ['admin_forever_access_2024', 'ADMIN_TOKEN_ValentinaGolosova2024']:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "SELECT expires_at, is_blocked FROM subscriptions WHERE user_token = %s",
                        (user_token,)
                    )
                    sub = cur.fetchone()
                    
                    if not sub or sub['expires_at'] < datetime.now():
                        return {
                            'statusCode': 403,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Subscription expired or invalid'})
                        }
                    
                    if sub.get('is_blocked'):
                        return {
                            'statusCode': 403,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Access blocked by administrator'})
                        }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                
                cur.execute(
                    "INSERT INTO t_p8566807_chat_access_project.messages (content, image_url, author_name, reply_to, user_token) VALUES (%s, %s, %s, %s, %s) RETURNING id, content, image_url, author_name, reply_to, created_at",
                    (content, image_url, author_name if author_name else None, reply_to, user_token)
                )
                new_msg = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'id': new_msg['id'],
                        'content': new_msg['content'],
                        'image_url': new_msg.get('image_url'),
                        'author_name': new_msg.get('author_name'),
                        'reply_to': new_msg['reply_to'],
                        'created_at': new_msg['created_at'].isoformat()
                    }, ensure_ascii=False)
                }
        
        if method == 'PATCH':
            if not user_token:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Token required'})
                }
            
            query_params = event.get('queryStringParameters', {}) or {}
            message_id = query_params.get('id')
            action = query_params.get('action')
            
            if not message_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Message ID required'})
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if action == 'pin':
                    is_admin = user_token in ['admin_forever_access_2024', 'ADMIN_TOKEN_ValentinaGolosova2024']
                    if not is_admin:
                        return {
                            'statusCode': 403,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Admin access required'})
                        }
                    
                    body_data = json.loads(event.get('body', '{}'))
                    is_pinned = body_data.get('is_pinned', False)
                    
                    cur.execute(
                        "UPDATE t_p8566807_chat_access_project.messages SET is_pinned = %s WHERE id = %s RETURNING id, is_pinned",
                        (is_pinned, message_id)
                    )
                    updated_msg = cur.fetchone()
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'success': True, 'id': updated_msg['id'], 'is_pinned': updated_msg['is_pinned']}, ensure_ascii=False)
                    }
                
                elif action == 'edit':
                    cur.execute(
                        "SELECT user_token, created_at FROM t_p8566807_chat_access_project.messages WHERE id = %s",
                        (message_id,)
                    )
                    msg = cur.fetchone()
                    
                    if not msg:
                        return {
                            'statusCode': 404,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Message not found'})
                        }
                    
                    if msg['user_token'] != user_token:
                        return {
                            'statusCode': 403,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Can only edit your own messages'})
                        }
                    
                    time_diff = (datetime.now() - msg['created_at']).total_seconds()
                    if time_diff > 300:
                        return {
                            'statusCode': 403,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Can only edit messages within 5 minutes'})
                        }
                    
                    body_data = json.loads(event.get('body', '{}'))
                    new_content = body_data.get('content', '').strip()
                    
                    if not new_content:
                        return {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Content required'})
                        }
                    
                    cur.execute(
                        "UPDATE t_p8566807_chat_access_project.messages SET content = %s, edited_at = NOW() WHERE id = %s RETURNING id, content, edited_at",
                        (new_content, message_id)
                    )
                    updated_msg = cur.fetchone()
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'success': True,
                            'id': updated_msg['id'],
                            'content': updated_msg['content'],
                            'edited_at': updated_msg['edited_at'].isoformat()
                        }, ensure_ascii=False)
                    }
                
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Invalid action'})
                }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    finally:
        conn.close()