# Test script for generate-qr Edge Function
# Usage: .\scripts\test-generate-qr.ps1 [card-id]

param(
    [string]$CardId = ""
)

# Load environment variables from .env.local if exists
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseAnonKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
$supabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_URL is not set" -ForegroundColor Red
    Write-Host "Please set it in .env.local or environment variables" -ForegroundColor Yellow
    exit 1
}

$apiKey = if ($supabaseServiceKey) { $supabaseServiceKey } else { $supabaseAnonKey }

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is not set" -ForegroundColor Red
    exit 1
}

# If card ID not provided, try to get one from database
if ([string]::IsNullOrWhiteSpace($CardId)) {
    Write-Host "Card ID not provided. Attempting to fetch a card from database..." -ForegroundColor Yellow
    
    try {
        $cardsUrl = "$supabaseUrl/rest/v1/business_cards?select=id&limit=1"
        $cardsResponse = Invoke-RestMethod -Uri $cardsUrl -Method GET -Headers @{
            "apikey" = $apiKey
            "Authorization" = "Bearer $apiKey"
        }
        
        if ($cardsResponse -and $cardsResponse.Count -gt 0) {
            $CardId = $cardsResponse[0].id
            Write-Host "Using card ID: $CardId" -ForegroundColor Cyan
        } else {
            Write-Host "No cards found in database. Please provide a card ID." -ForegroundColor Red
            Write-Host "Usage: .\scripts\test-generate-qr.ps1 -CardId <card-id>" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "Could not fetch card from database. Please provide a card ID." -ForegroundColor Red
        Write-Host "Usage: .\scripts\test-generate-qr.ps1 -CardId <card-id>" -ForegroundColor Yellow
        exit 1
    }
}

$functionUrl = "$supabaseUrl/functions/v1/generate-qr"
$body = @{
    cardId = $CardId
} | ConvertTo-Json

Write-Host ""
Write-Host "🧪 Testing generate-qr Edge Function" -ForegroundColor Cyan
Write-Host "   URL: $functionUrl" -ForegroundColor Gray
Write-Host "   Card ID: $CardId" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $functionUrl -Method POST -Headers @{
        "Content-Type" = "application/json"
        "apikey" = $apiKey
        "Authorization" = "Bearer $apiKey"
    } -Body $body

    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    if ($response.success -and $response.qrCode) {
        Write-Host ""
        Write-Host "QR Code generated successfully!" -ForegroundColor Green
        Write-Host "Public URL: $($response.publicUrl)" -ForegroundColor Cyan
        Write-Host "Card Name: $($response.card.name)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💡 The QR code is a data URL. You can use it directly in an <img> tag:" -ForegroundColor Yellow
        Write-Host "   <img src=`"$($response.qrCode.Substring(0, [Math]::Min(50, $response.qrCode.Length)))...`" />" -ForegroundColor Gray
    }
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

