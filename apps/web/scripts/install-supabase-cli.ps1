# Install Supabase CLI for Windows
Write-Host "Installing Supabase CLI for Windows..." -ForegroundColor Green

# Create directory for Supabase CLI
$cliDir = "$env:USERPROFILE\supabase-cli"
if (!(Test-Path $cliDir)) {
    New-Item -ItemType Directory -Path $cliDir
}

# Download Supabase CLI
Write-Host "Downloading Supabase CLI..." -ForegroundColor Yellow
$downloadUrl = "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip"
$zipFile = "$cliDir\supabase.zip"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile
    Write-Host "Download completed!" -ForegroundColor Green
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

# Extract the zip file
Write-Host "Extracting..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $zipFile -DestinationPath $cliDir -Force
    Write-Host "Extraction completed!" -ForegroundColor Green
} catch {
    Write-Host "Extraction failed: $_" -ForegroundColor Red
    exit 1
}

# Clean up zip file
Remove-Item $zipFile

# Add to PATH for current session
$env:PATH += ";$cliDir"

# Test installation
Write-Host "Testing installation..." -ForegroundColor Yellow
try {
    & "$cliDir\supabase.exe" --version
    Write-Host "Supabase CLI installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Installation test failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. supabase login" -ForegroundColor White
Write-Host "2. supabase link --project-ref eccyqifrzipzrflkcdkd" -ForegroundColor White
Write-Host "3. supabase functions deploy update-profile --project-ref eccyqifrzipzrflkcdkd" -ForegroundColor White
Write-Host ""
Write-Host "To make it permanent, add $cliDir to your PATH environment variable." -ForegroundColor Yellow
