# Script to check if Edge Functions are accessible
param(
    [string]$ProjectRef = ""
)

# Get project ref
if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
    $ProjectRef = $env:SUPABASE_PROJECT_REF
}

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

# Get Supabase URL
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL

if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_URL is not set" -ForegroundColor Red
    Write-Host "Please set it in .env.local or environment variables" -ForegroundColor Yellow
    Write-Host "Looking for .env.local at: $(Resolve-Path .)" -ForegroundColor Gray
    exit 1
}

if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
    Write-Host "WARNING: SUPABASE_PROJECT_REF is not set" -ForegroundColor Yellow
    Write-Host "Trying to extract from NEXT_PUBLIC_SUPABASE_URL..." -ForegroundColor Yellow
    
    # Try to extract project ref from URL
    if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
        $ProjectRef = $matches[1]
        Write-Host "Extracted project ref: $ProjectRef" -ForegroundColor Cyan
    } else {
        Write-Host "ERROR: Could not extract project ref from URL" -ForegroundColor Red
        exit 1
    }
}

$functions = @(
    "get-profile",
    "update-profile",
    "sync-user-metadata",
    "addresses",
    "upload-profile",
    "templates",
    "card-views",
    "generate-qr",
    "contact",
    "upload-logo",
    "delete-account",
    "export-paper-card"
)

Write-Host ""
Write-Host "Checking Edge Functions accessibility..." -ForegroundColor Cyan
Write-Host "Supabase URL: $supabaseUrl" -ForegroundColor Gray
Write-Host "Project Ref: $ProjectRef" -ForegroundColor Gray
Write-Host ""

$failedFunctions = @()

foreach ($func in $functions) {
    $functionUrl = "$supabaseUrl/functions/v1/$func"
    
    try {
        $response = Invoke-WebRequest -Uri $functionUrl -Method OPTIONS -ErrorAction Stop -TimeoutSec 5
        
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] $func - Accessible" -ForegroundColor Green
        } else {
            Write-Host "[WARN] $func - Status: $($response.StatusCode)" -ForegroundColor Yellow
            $failedFunctions += $func
        }
    } catch {
        Write-Host "[FAIL] $func - Not accessible" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
        $failedFunctions += $func
    }
}

Write-Host ""
if ($failedFunctions.Count -eq 0) {
    Write-Host "All Edge Functions are accessible!" -ForegroundColor Green
} else {
    Write-Host "Some Edge Functions are not accessible:" -ForegroundColor Red
    foreach ($func in $failedFunctions) {
        Write-Host "  - $func" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Please deploy Edge Functions:" -ForegroundColor Yellow
    Write-Host "  npm run deploy:functions" -ForegroundColor Cyan
}
