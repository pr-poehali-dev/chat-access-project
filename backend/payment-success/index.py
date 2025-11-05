import json
import os
import hashlib
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import quote

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Handle payment success redirect from Robokassa
    Args: event - dict with httpMethod, queryStringParameters
          context - object with request_id
    Returns: HTTP redirect to success page with token
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        inv_id = params.get('InvId', '')
        
        if not inv_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'text/html'},
                'body': '<html><body><h1>Ошибка: отсутствует ID заказа</h1></body></html>'
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT s.user_token, s.plan 
                    FROM t_p8566807_chat_access_project.subscriptions s
                    JOIN t_p8566807_chat_access_project.payment_orders p ON p.invoice_id = %s
                    WHERE p.status = 'paid'
                    ORDER BY s.created_at DESC
                    LIMIT 1
                    """,
                    (inv_id,)
                )
                result = cur.fetchone()
                
                if result:
                    token = result['user_token']
                    plan = result['plan']
                    redirect_url = f"https://{event['headers'].get('host', 'localhost')}/payment-success?token={quote(token)}&plan={plan}"
                else:
                    redirect_url = f"https://{event['headers'].get('host', 'localhost')}/?payment=pending"
                
                return {
                    'statusCode': 302,
                    'headers': {
                        'Location': redirect_url
                    },
                    'body': ''
                }
        finally:
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
