"""
FreshSilver Trip Backend - Lambda Handler
Handles chat messages and RSVP for events
"""

import json
import os
import time
import uuid
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
messages_table = dynamodb.Table(os.environ['MESSAGES_TABLE'])
rsvp_table = dynamodb.Table(os.environ['RSVP_TABLE'])

# Keep messages for 30 days
MESSAGE_TTL_DAYS = 30

def json_response(status_code: int, body: dict) -> dict:
    """Create a JSON HTTP response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps(body, default=str)
    }


def decimal_to_native(obj):
    """Convert DynamoDB Decimal to Python native types"""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    if isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    return obj


def get_messages():
    """Get last 50 chat messages"""
    try:
        response = messages_table.query(
            KeyConditionExpression=Key('pk').eq('MESSAGES'),
            ScanIndexForward=False,  # newest first
            Limit=50
        )
        messages = [decimal_to_native(item) for item in response.get('Items', [])]
        # Reverse to get oldest first for display
        messages.reverse()
        return json_response(200, {'messages': messages})
    except Exception as e:
        return json_response(500, {'error': str(e)})


def post_message(body: dict):
    """Post a new chat message"""
    try:
        text = body.get('text', '').strip()
        author = body.get('author', 'Anonymous').strip()
        color = body.get('color', '#0EA5E9')
        
        if not text or len(text) > 500:
            return json_response(400, {'error': 'Invalid message text'})
        if len(author) > 50:
            return json_response(400, {'error': 'Author name too long'})
        
        timestamp = int(time.time() * 1000)
        message_id = f"{timestamp}-{uuid.uuid4().hex[:8]}"
        ttl = int(time.time()) + (MESSAGE_TTL_DAYS * 24 * 60 * 60)
        
        item = {
            'pk': 'MESSAGES',
            'sk': message_id,
            'id': message_id,
            'text': text,
            'author': author,
            'color': color,
            'timestamp': timestamp,
            'ttl': ttl
        }
        
        messages_table.put_item(Item=item)
        return json_response(201, {'message': decimal_to_native(item)})
    except Exception as e:
        return json_response(500, {'error': str(e)})


def get_rsvp(event_id: str):
    """Get all RSVPs for an event"""
    try:
        response = rsvp_table.query(
            KeyConditionExpression=Key('eventId').eq(event_id)
        )
        attendees = [decimal_to_native(item) for item in response.get('Items', [])]
        return json_response(200, {'attendees': attendees})
    except Exception as e:
        return json_response(500, {'error': str(e)})


def post_rsvp(event_id: str, body: dict, visitor_id: str):
    """Add an RSVP for an event"""
    try:
        name = body.get('name', '').strip()
        color = body.get('color', '#0EA5E9')
        
        if not name or len(name) > 30:
            return json_response(400, {'error': 'Invalid name'})
        if not visitor_id:
            return json_response(400, {'error': 'Missing visitor ID'})
        
        timestamp = int(time.time() * 1000)
        
        item = {
            'eventId': event_id,
            'visitorId': visitor_id,
            'id': f"{event_id}-{visitor_id}",
            'name': name,
            'color': color,
            'timestamp': timestamp
        }
        
        rsvp_table.put_item(Item=item)
        return json_response(201, {'rsvp': decimal_to_native(item)})
    except Exception as e:
        return json_response(500, {'error': str(e)})


def delete_rsvp(event_id: str, visitor_id: str):
    """Remove an RSVP"""
    try:
        rsvp_table.delete_item(
            Key={
                'eventId': event_id,
                'visitorId': visitor_id
            }
        )
        return json_response(200, {'deleted': True})
    except Exception as e:
        return json_response(500, {'error': str(e)})


def lambda_handler(event, context):
    """Main Lambda handler"""
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath', '')
    
    # Parse body if present
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            return json_response(400, {'error': 'Invalid JSON'})
    
    # Get visitor ID from header (for RSVP tracking)
    headers = event.get('headers', {})
    visitor_id = headers.get('x-visitor-id', '')
    
    # Route requests
    if path == '/messages' or path == '/prod/messages':
        if method == 'GET':
            return get_messages()
        elif method == 'POST':
            return post_message(body)
    
    elif path.startswith('/rsvp/') or path.startswith('/prod/rsvp/'):
        # Extract event_id and optional visitor_id from path
        parts = path.replace('/prod', '').split('/')
        # /rsvp/{eventId} or /rsvp/{eventId}/{visitorId}
        
        if len(parts) >= 3:
            event_id = parts[2]
            
            if method == 'GET':
                return get_rsvp(event_id)
            elif method == 'POST':
                return post_rsvp(event_id, body, visitor_id)
            elif method == 'DELETE' and len(parts) >= 4:
                path_visitor_id = parts[3]
                return delete_rsvp(event_id, path_visitor_id)
    
    return json_response(404, {'error': 'Not found'})
