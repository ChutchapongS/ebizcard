#!/bin/bash

# Deploy Supabase Edge Functions
echo "Deploying Supabase Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Deploy the update-profile function
echo "Deploying update-profile function..."
supabase functions deploy update-profile --project-ref eccyqifrzipzrflkcdkd

echo "Edge Functions deployed successfully!"
