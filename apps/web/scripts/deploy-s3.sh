#!/bin/bash

# Bash script for deploying Next.js static export to AWS S3
# Usage: ./scripts/deploy-s3.sh

set -e

BUCKET_NAME="${1:-}"
REGION="${2:-ap-southeast-1}"
DRY_RUN="${3:-false}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi

# Check if bucket name is provided
if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Bucket name is required!"
    echo "Usage: ./scripts/deploy-s3.sh <bucket-name> [region] [dry-run]"
    exit 1
fi

# Check if out directory exists
if [ ! -d "out" ]; then
    echo "❌ 'out' directory not found. Please run 'npm run build:s3' first."
    exit 1
fi

echo "🚀 Starting S3 deployment..."
echo "   Bucket: $BUCKET_NAME"
echo "   Region: $REGION"
echo "   Dry Run: $DRY_RUN"
echo ""

# Check if bucket exists
echo "📦 Checking if bucket exists..."
if ! aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    echo "⚠️  Bucket does not exist or you don't have access. Creating bucket..."
    if [ "$DRY_RUN" != "true" ]; then
        aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
        echo "✅ Bucket created successfully"
    else
        echo "   [DRY RUN] Would create bucket: s3://$BUCKET_NAME"
    fi
fi

# Enable static website hosting
echo "🌐 Configuring static website hosting..."
if [ "$DRY_RUN" != "true" ]; then
    aws s3api put-bucket-website \
        --bucket "$BUCKET_NAME" \
        --website-configuration '{
            "IndexDocument": {"Suffix": "index.html"},
            "ErrorDocument": {"Key": "404.html"}
        }'
    echo "✅ Website hosting configured"
else
    echo "   [DRY RUN] Would configure website hosting"
fi

# Upload files
echo "📤 Uploading files to S3..."
if [ "$DRY_RUN" != "true" ]; then
    # Upload static assets with long cache
    aws s3 sync "out" "s3://$BUCKET_NAME" \
        --delete \
        --region "$REGION" \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "*.html" \
        --exclude "*.json"
    
    # Upload HTML files with no-cache
    aws s3 sync "out" "s3://$BUCKET_NAME" \
        --delete \
        --region "$REGION" \
        --cache-control "public, max-age=0, must-revalidate" \
        --exclude "*" \
        --include "*.html" \
        --include "*.json"
    
    echo "✅ Files uploaded successfully"
else
    echo "   [DRY RUN] Would sync 'out' directory to s3://$BUCKET_NAME"
fi

# Get bucket website URL
echo ""
echo "✅ Deployment completed!"
echo "   Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo "💡 Next steps:"
echo "   1. Configure CloudFront for HTTPS and custom domain"
echo "   2. Set up bucket policy for public read access"
echo "   3. Configure CORS if needed"

