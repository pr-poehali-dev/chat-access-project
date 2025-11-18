import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Admin login with password validation
    Args: event - dict with httpMethod, body
          context - object with request_id
    Returns: HTTP response with admin token
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
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_str = event.get('body', '{}')
    print(f'DEBUG: Received body string: {body_str}')
    body_data = json.loads(body_str)
    print(f'DEBUG: Parsed body data: {body_data}')
    password = body_data.get('password', '')
    print(f'DEBUG: Extracted password: "{password}" (length: {len(password)})')
    
    admin_password = 'ValentinaGolosova2024'
    print(f'DEBUG: Expected password: "{admin_password}" (length: {len(admin_password)})')
    print(f'DEBUG: Passwords match: {password == admin_password}')
    
    if password == admin_password:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'token': 'ADMIN_TOKEN_ValentinaGolosova2024',
                'is_admin': True
            })
        }
    else:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Неверный пароль'})
        }