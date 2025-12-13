#!/bin/bash
# Deploy FreshSilver backend to AWS

set -e

STACK_NAME="freshsilver-backend"
REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET="${SAM_BUCKET:-}"

echo "🚀 Deploying FreshSilver Backend..."
echo "   Region: $REGION"
echo "   Stack: $STACK_NAME"

# Check for SAM CLI
if ! command -v sam &> /dev/null; then
    echo "❌ AWS SAM CLI not found. Install it first:"
    echo "   pip install aws-sam-cli"
    exit 1
fi

# Build
echo ""
echo "📦 Building..."
sam build

# Deploy
echo ""
echo "☁️  Deploying..."
if [ -n "$S3_BUCKET" ]; then
    sam deploy \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --s3-bucket "$S3_BUCKET" \
        --capabilities CAPABILITY_IAM \
        --no-confirm-changeset \
        --no-fail-on-empty-changeset
else
    sam deploy \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --resolve-s3 \
        --capabilities CAPABILITY_IAM \
        --no-confirm-changeset \
        --no-fail-on-empty-changeset
fi

# Get API endpoint
echo ""
echo "✅ Deployment complete!"
echo ""
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
    --output text)

echo "🔗 API Endpoint: $API_URL"
echo ""
echo "📝 Update your .env.local with:"
echo "   VITE_API_URL=$API_URL"
