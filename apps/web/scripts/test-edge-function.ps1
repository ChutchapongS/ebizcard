# PowerShell script for testing Supabase Edge Functions
param(
    [Parameter(Mandatory=$true)]
    [string]$FunctionName,
    
    [string]$Method = "POST",
    [string]$Body = "{}",
    [string]$ProjectRef = ""
)

# Get project ref
if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
    $ProjectRef = $env:SUPABASE_PROJECT_REF
}

# Get Supabase URL and keys
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseAnonKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
$supabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_URL is not set" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($supabaseAnonKey) -and [string]::IsNullOrWhiteSpace($supabaseServiceKey)) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is not set" -ForegroundColor Red
    exit 1
}

# Use service key if available, otherwise use anon key
$apiKey = if ($supabaseServiceKey) { $supabaseServiceKey } else { $supabaseAnonKey }

# Construct function URL
$functionUrl = "$supabaseUrl/functions/v1/$FunctionName"

Write-Host "Testing Edge Function: $FunctionName" -ForegroundColor Cyan
Write-Host "URL: $functionUrl" -ForegroundColor Gray
Write-Host "Method: $Method" -ForegroundColor Gray
Write-Host "Body: $Body" -ForegroundColor Gray
Write-Host ""

# Make request
try {
    $headers = @{
        "Content-Type" = "application/json"
        "apikey" = $apiKey
        "Authorization" = "Bearer $apiKey"
    }

    $response = Invoke-RestMethod -Uri $functionUrl -Method $Method -Headers $headers -Body $Body -ErrorAction Stop

    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "Error Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    
    if ($_.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
    
    exit 1
}

