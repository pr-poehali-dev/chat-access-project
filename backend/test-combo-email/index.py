import json
import urllib.request

def handler(event, context):
    '''
    Business: Test combo webhook by sending request
    Args: event, context
    Returns: HTTP response
    '''
    try:
        payload = {
            "email": "v89661655608@gmail.com",
            "test": "final",
            "amount": 4999
        }
        
        req = urllib.request.Request(
            'https://functions.poehali.dev/66d27e23-0698-4d41-8708-9c7e34148508',
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'X-Api-Key': 'bankrot_combo_secret_2025'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode('utf-8'))
            
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True,
                'webhook_response': result
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }