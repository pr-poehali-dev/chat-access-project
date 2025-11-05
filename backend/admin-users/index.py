import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Admin API for managing users - view subscriptions and block access
    Args: event - dict with httpMethod, headers (X-User-Token), body (for updates)
    Returns: HTTP response with users list or update confirmation
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_token = headers.get('X-User-Token') or headers.get('x-user-token')
    
    if user_token != 'admin_forever_access_2024':
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Admin access required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT 
                        user_token, 
                        email, 
                        plan, 
                        expires_at, 
                        created_at, 
                        is_blocked,
                        (SELECT COUNT(*) FROM t_p8566807_chat_access_project.messages WHERE user_token = subscriptions.user_token) as message_count
                    FROM t_p8566807_chat_access_project.subscriptions 
                    ORDER BY created_at DESC
                    """
                )
                users = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'users': [
                            {
                                'user_token': user['user_token'],
                                'email': user['email'],
                                'plan': user['plan'],
                                'expires_at': user['expires_at'].isoformat(),
                                'created_at': user['created_at'].isoformat(),
                                'is_blocked': user['is_blocked'],
                                'message_count': user['message_count']
                            }
                            for user in users
                        ]
                    }, ensure_ascii=False)
                }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            target_user_token = body_data.get('user_token')
            is_blocked = body_data.get('is_blocked')
            
            if not target_user_token or is_blocked is None:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'user_token and is_blocked required'})
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "UPDATE t_p8566807_chat_access_project.subscriptions SET is_blocked = %s WHERE user_token = %s RETURNING user_token, is_blocked",
                    (is_blocked, target_user_token)
                )
                updated_user = cur.fetchone()
                conn.commit()
                
                if not updated_user:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'user_token': updated_user['user_token'],
                        'is_blocked': updated_user['is_blocked']
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
    finally:
        conn.close()
