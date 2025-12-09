# PowerShell script for deploying Supabase Edge Functions
param(
    [string]$FunctionName = "",
    [string]$ProjectRef = ""
)

# Check if supabase CLI is installed
$supabaseCmd = "supabase"
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    if (Get-Command npx -ErrorAction SilentlyContinue) {
        $supabaseCmd = "npx supabase"
        Write-Host "Using npx supabase" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Supabase CLI is not installed" -ForegroundColor Red
        Write-Host "Install: npm install -g supabase" -ForegroundColor Yellow
        exit 1
    }
}

# Get project ref
if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
    $ProjectRef = $env:SUPABASE_PROJECT_REF
}

# List of functions
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
    "export-paper-card",
    "user-portal-login",
    "web-settings",
    "level-capabilities",
    "menu-visibility",
    "update-user-type",
    "upload-website-logo",
    "upload-slide-image",
    "upload-feature-icon"
)

# Change to root directory (where supabase/config.toml is located)
$scriptPath = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptPath)) {
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
}
# Get web directory (apps/web)
$webDir = (Resolve-Path (Join-Path $scriptPath "..")).Path
# Get root directory - go up 2 levels from apps/web to root
$rootDir = Split-Path -Parent (Split-Path -Parent $webDir)

# Check if supabase config exists at root
$configPath = Join-Path $rootDir "supabase\config.toml"
Write-Host "Checking config at: $configPath" -ForegroundColor Gray
if (Test-Path $configPath) {
    Set-Location $rootDir
    Write-Host "Using root directory: $rootDir" -ForegroundColor Cyan
    
    # Create symlink if it doesn't exist (requires admin, so we'll use workaround)
    $symlinkPath = Join-Path $rootDir "supabase\functions"
    $targetPath = Join-Path $webDir "supabase\functions"
    
    if (-not (Test-Path $symlinkPath)) {
        Write-Host "Creating symlink from supabase\functions to apps\web\supabase\functions..." -ForegroundColor Yellow
        Write-Host "NOTE: This requires Administrator privileges. If it fails, run PowerShell as Administrator." -ForegroundColor Yellow
        try {
            New-Item -ItemType SymbolicLink -Path $symlinkPath -Target $targetPath -Force | Out-Null
            Write-Host "Symlink created successfully!" -ForegroundColor Green
        } catch {
            Write-Host "WARNING: Could not create symlink. Trying alternative method..." -ForegroundColor Yellow
            # Alternative: Use junction (doesn't require admin on same drive)
            try {
                cmd /c mklink /J "$symlinkPath" "$targetPath" 2>&1 | Out-Null
                Write-Host "Junction created successfully!" -ForegroundColor Green
            } catch {
                Write-Host "ERROR: Could not create symlink or junction. Please run as Administrator or create manually." -ForegroundColor Red
                Write-Host "Manual command: mklink /D supabase\functions apps\web\supabase\functions" -ForegroundColor Yellow
                exit 1
            }
        }
    }
} elseif (Test-Path (Join-Path $webDir "supabase\config.toml")) {
    Set-Location $webDir
    Write-Host "Using web directory: $webDir" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Cannot find supabase config.toml" -ForegroundColor Red
    exit 1
}

Write-Host "Starting Edge Functions deployment..." -ForegroundColor Green
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Deploy specific function or all
if (-not [string]::IsNullOrWhiteSpace($FunctionName)) {
    if ($functions -contains $FunctionName) {
        Write-Host "Deploying function: $FunctionName" -ForegroundColor Yellow
        # Deploy from apps/web/supabase/functions if it exists, otherwise from supabase/functions
        $functionPath = "apps\web\supabase\functions\$FunctionName"
        if (-not (Test-Path $functionPath)) {
            $functionPath = "supabase\functions\$FunctionName"
        }
        
        $deployCmd = "$supabaseCmd functions deploy $FunctionName"
        if (-not [string]::IsNullOrWhiteSpace($ProjectRef)) {
            $deployCmd += " --project-ref $ProjectRef"
        }
        Invoke-Expression $deployCmd
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: Function deployed!" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Failed to deploy function" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "ERROR: Function not found: $FunctionName" -ForegroundColor Red
        Write-Host "Available: $($functions -join ', ')" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Deploying all Edge Functions..." -ForegroundColor Yellow
    Write-Host ""
    $failedFunctions = @()
    foreach ($func in $functions) {
        Write-Host "Deploying $func..." -ForegroundColor Cyan
        # Deploy from apps/web/supabase/functions if it exists, otherwise from supabase/functions
        $functionPath = "apps\web\supabase\functions\$func"
        if (-not (Test-Path $functionPath)) {
            $functionPath = "supabase\functions\$func"
        }
        
        $deployCmd = "$supabaseCmd functions deploy $func"
        if (-not [string]::IsNullOrWhiteSpace($ProjectRef)) {
            $deployCmd += " --project-ref $ProjectRef"
        }
        Invoke-Expression $deployCmd
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: $func deployed!" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Failed to deploy $func" -ForegroundColor Red
            $failedFunctions += $func
        }
        Write-Host ""
    }
    if ($failedFunctions.Count -eq 0) {
        Write-Host "All Edge Functions deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Some functions failed:" -ForegroundColor Yellow
        foreach ($func in $failedFunctions) {
            Write-Host "  - $func" -ForegroundColor Red
        }
        exit 1
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test functions in Supabase Dashboard" -ForegroundColor Gray
Write-Host "  2. Monitor logs: supabase functions logs" -ForegroundColor Gray
