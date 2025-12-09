# Script to fix update-profile Edge Function
# This script will redeploy the function and check its status

param(
    [string]$ProjectRef = ""
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

# Get project ref
if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
    $ProjectRef = $env:SUPABASE_PROJECT_REF
}

# Get Supabase URL
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL

if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_URL is not set" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
    if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
        $ProjectRef = $matches[1]
    } else {
        Write-Host "ERROR: Could not extract project ref" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Fixing update-profile Edge Function..." -ForegroundColor Cyan
Write-Host "Project Ref: $ProjectRef" -ForegroundColor Gray
Write-Host ""

# Check if supabase CLI is installed
$supabaseCmd = "supabase"
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    if (Get-Command npx -ErrorAction SilentlyContinue) {
        $supabaseCmd = "npx supabase"
        Write-Host "Using npx supabase" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Supabase CLI is not installed" -ForegroundColor Red
        exit 1
    }
}

# Change to root directory
$scriptPath = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptPath)) {
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$webDir = (Resolve-Path (Join-Path $scriptPath "..")).Path
$rootDir = Split-Path -Parent (Split-Path -Parent $webDir)

if (Test-Path (Join-Path $rootDir "supabase\config.toml")) {
    Set-Location $rootDir
    Write-Host "Working directory: $rootDir" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: supabase/config.toml not found" -ForegroundColor Red
    exit 1
}

# Deploy update-profile
Write-Host "Deploying update-profile..." -ForegroundColor Yellow
$deployCmd = "$supabaseCmd functions deploy update-profile"
if (-not [string]::IsNullOrWhiteSpace($ProjectRef)) {
    $deployCmd += " --project-ref $ProjectRef"
}

Invoke-Expression $deployCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: update-profile deployed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting 5 seconds for function to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Check if function is accessible
    $functionUrl = "$supabaseUrl/functions/v1/update-profile"
    try {
        $response = Invoke-WebRequest -Uri $functionUrl -Method OPTIONS -ErrorAction Stop -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] update-profile is now accessible!" -ForegroundColor Green
        } else {
            Write-Host "[WARN] update-profile returned status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[WARN] update-profile may still be unavailable: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Please wait a few more seconds and check again" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to deploy update-profile" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    exit 1
}

