import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import secrets

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Subscription management API for creating and validating access tokens
    Args: event - dict with httpMethod, body with plan (week/month)
          context - object with request_id
    Returns: HTTP response with token and expiration date
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            plan = body_data.get('plan', 'month')
            
            if plan not in ['week', 'month']:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Invalid plan. Use week or month'})
                }
            
            token = secrets.token_urlsafe(32)
            expires_at = datetime.now() + timedelta(days=7 if plan == 'week' else 30)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "INSERT INTO subscriptions (user_token, plan, expires_at) VALUES (%s, %s, %s) RETURNING id, user_token, plan, expires_at, created_at",
                    (token, plan, expires_at)
                )
                sub = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'token': sub['user_token'],
                        'plan': sub['plan'],
                        'expires_at': sub['expires_at'].isoformat(),
                        'created_at': sub['created_at'].isoformat()
                    }, ensure_ascii=False)
                }
        
        if method == 'GET':
            headers = event.get('headers', {})
            user_token = headers.get('X-User-Token') or headers.get('x-user-token')
            
            if not user_token:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Token required'})
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, plan, expires_at, created_at FROM subscriptions WHERE user_token = %s",
                    (user_token,)
                )
                sub = cur.fetchone()
                
                if not sub:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Subscription not found'})
                    }
                
                is_active = sub['expires_at'] > datetime.now()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'plan': sub['plan'],
                        'expires_at': sub['expires_at'].isoformat(),
                        'created_at': sub['created_at'].isoformat(),
                        'is_active': is_active
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
