#!/bin/bash

# Bash script for deploying Supabase Edge Functions
# Usage: ./scripts/deploy-edge-functions.sh [function-name] [project-ref]

set -e

FUNCTION_NAME="${1:-}"
PROJECT_REF="${2:-${SUPABASE_PROJECT_REF:-}}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    echo "   Or download from: https://github.com/supabase/cli/releases"
    exit 1
fi

# List of all Edge Functions to deploy
FUNCTIONS=(
    "get-profile"
    "update-profile"
    "sync-user-metadata"
    "addresses"
    "upload-profile"
    "templates"
    "card-views"
    "generate-qr"
    "contact"
    "upload-logo"
    "delete-account"
    "export-paper-card"
)

# Change to web directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$WEB_DIR"

echo "🚀 Starting Edge Functions deployment..."
echo "   Working directory: $(pwd)"
echo ""

# If specific function is provided
if [ -n "$FUNCTION_NAME" ]; then
    if [[ " ${FUNCTIONS[@]} " =~ " ${FUNCTION_NAME} " ]]; then
        echo "📦 Deploying function: $FUNCTION_NAME"
        
        DEPLOY_CMD="supabase functions deploy $FUNCTION_NAME"
        if [ -n "$PROJECT_REF" ]; then
            DEPLOY_CMD="$DEPLOY_CMD --project-ref $PROJECT_REF"
        fi
        
        eval $DEPLOY_CMD
        
        if [ $? -eq 0 ]; then
            echo "✅ Function '$FUNCTION_NAME' deployed successfully!"
        else
            echo "❌ Failed to deploy function '$FUNCTION_NAME'"
            exit 1
        fi
    else
        echo "❌ Function '$FUNCTION_NAME' not found!"
        echo "   Available functions: ${FUNCTIONS[*]}"
        exit 1
    fi
else
    # Deploy all functions
    echo "📦 Deploying all Edge Functions..."
    echo ""
    
    FAILED_FUNCTIONS=()
    
    for func in "${FUNCTIONS[@]}"; do
        echo "Deploying $func..."
        
        DEPLOY_CMD="supabase functions deploy $func"
        if [ -n "$PROJECT_REF" ]; then
            DEPLOY_CMD="$DEPLOY_CMD --project-ref $PROJECT_REF"
        fi
        
        eval $DEPLOY_CMD
        
        if [ $? -eq 0 ]; then
            echo "✅ $func deployed successfully!"
        else
            echo "❌ Failed to deploy $func"
            FAILED_FUNCTIONS+=("$func")
        fi
        echo ""
    done
    
    if [ ${#FAILED_FUNCTIONS[@]} -eq 0 ]; then
        echo "🎉 All Edge Functions deployed successfully!"
    else
        echo "⚠️  Some functions failed to deploy:"
        for func in "${FAILED_FUNCTIONS[@]}"; do
            echo "   - $func"
        done
        exit 1
    fi
fi

echo ""
echo "💡 Next steps:"
echo "   1. Test the functions using Supabase Dashboard"
echo "   2. Update client code to use Edge Functions"
echo "   3. Monitor function logs: supabase functions logs"

