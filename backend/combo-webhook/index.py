import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import secrets

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Webhook for combo package purchases from bankrot-kurs.ru
    Args: event - dict with httpMethod, body containing email and amount
          context - object with request_id
    Returns: HTTP response with success/error status
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
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
    
    api_key = event.get('headers', {}).get('x-api-key') or event.get('headers', {}).get('X-Api-Key')
    expected_key = os.environ.get('COMBO_WEBHOOK_API_KEY', 'bankrot_combo_secret_2025')
    
    if api_key != expected_key:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    try:
        body_str = event.get('body') or '{}'
        body_data = json.loads(body_str)
        
        email = body_data.get('email')
        amount = body_data.get('amount')
        
        if not email:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Email is required'})
            }
        
        print(f"Combo webhook received: email={email}, amount={amount}")
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                safe_email = email.replace("'", "''")
                
                cur.execute(
                    f"SELECT user_token FROM t_p8566807_chat_access_project.subscriptions WHERE email = '{safe_email}' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1"
                )
                existing = cur.fetchone()
                
                if existing:
                    token = existing['user_token']
                    print(f"Active subscription exists for {email}, returning existing token")
                else:
                    token = secrets.token_urlsafe(32)
                    expires_at = datetime.now() + timedelta(days=30)
                    expires_str = expires_at.strftime('%Y-%m-%d %H:%M:%S')
                    safe_token = token.replace("'", "''")
                    
                    cur.execute(
                        f"INSERT INTO t_p8566807_chat_access_project.subscriptions (user_token, plan, expires_at, email, is_blocked) VALUES ('{safe_token}', 'month', '{expires_str}', '{safe_email}', false)"
                    )
                    conn.commit()
                    print(f"New subscription created: token={token[:10]}..., expires={expires_at}")
                
                chat_url = 'https://chat-bankrot.ru'
                expires_date = (datetime.now() + timedelta(days=30)).strftime('%d.%m.%Y')
                
                print(f"✅ Token created successfully for {email}, returning to bankrot-kurs.ru")
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'token': token,
                        'chat_url': chat_url,
                        'expires_at': expires_date,
                        'email': email
                    })
                }
        finally:
            conn.close()
            
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }