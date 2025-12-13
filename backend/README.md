# FreshSilver Backend

Serverless backend for the FreshSilver trip site - handles chat messages and event RSVPs.

## Architecture

- **API Gateway HTTP API** - Low-latency, cost-effective REST endpoints
- **Lambda** - Python 3.11 function handling all routes
- **DynamoDB** - Two tables for messages and RSVPs (pay-per-request)

## Prerequisites

1. AWS CLI configured with credentials (`aws configure`)
2. AWS SAM CLI installed (`pip install aws-sam-cli`)

## Deploy

```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
sam build
sam deploy --guided
```

## API Endpoints

### Messages

```
GET  /messages          - Get last 50 messages
POST /messages          - Post a new message
     Body: { "text": "Hello!", "author": "David", "color": "#0EA5E9" }
```

### RSVP

```
GET    /rsvp/{eventId}              - Get all RSVPs for event
POST   /rsvp/{eventId}              - Add RSVP (requires X-Visitor-Id header)
       Body: { "name": "David", "color": "#0EA5E9" }
DELETE /rsvp/{eventId}/{visitorId}  - Remove RSVP
```

## Frontend Configuration

After deploying, update `freshsilver-site/.env.local`:

```
VITE_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

## Costs

With pay-per-request DynamoDB and Lambda:
- **Free tier**: First 1M requests/month free
- **After**: ~$0.20 per million requests
- **Storage**: $0.25/GB/month (minimal for text)

Expected cost for a small trip site: **< $1/month**

## Local Development

```bash
# Start local API (requires Docker)
sam local start-api

# Test endpoints
curl http://localhost:3000/messages
```

## Cleanup

```bash
aws cloudformation delete-stack --stack-name freshsilver-backend
```
