#!/bin/bash

# Bash script for testing Supabase Edge Functions
# Usage: ./scripts/test-edge-function.sh <function-name> [method] [body] [project-ref]

set -e

FUNCTION_NAME="${1:-}"
METHOD="${2:-POST}"
BODY="${3:-{}}"
PROJECT_REF="${4:-${SUPABASE_PROJECT_REF:-}}"

if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ Function name is required"
    echo "Usage: ./scripts/test-edge-function.sh <function-name> [method] [body] [project-ref]"
    exit 1
fi

# Get Supabase URL and keys
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi

# Use service key if available, otherwise use anon key
API_KEY="${SUPABASE_SERVICE_KEY:-$SUPABASE_ANON_KEY}"

if [ -z "$API_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is not set"
    exit 1
fi

# Construct function URL
FUNCTION_URL="$SUPABASE_URL/functions/v1/$FUNCTION_NAME"

echo "🧪 Testing Edge Function: $FUNCTION_NAME"
echo "   URL: $FUNCTION_URL"
echo "   Method: $METHOD"
echo "   Body: $BODY"
echo ""

# Make request
RESPONSE=$(curl -s -w "\n%{http_code}" -X "$METHOD" \
    -H "Content-Type: application/json" \
    -H "apikey: $API_KEY" \
    -H "Authorization: Bearer $API_KEY" \
    -d "$BODY" \
    "$FUNCTION_URL")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "✅ Success! (HTTP $HTTP_CODE)"
    echo ""
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ Error! (HTTP $HTTP_CODE)"
    echo ""
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    exit 1
fi

