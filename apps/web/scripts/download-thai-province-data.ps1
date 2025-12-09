# Script to download Thai province data with Thai and English names
# from https://github.com/kongvut/thai-province-data

$baseUrl = "https://raw.githubusercontent.com/kongvut/thai-province-data/master"
$dataDir = "apps/web/src/data/thai-province-data"

# Create directory if it doesn't exist
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

Write-Host "Downloading Thai province data from kongvut/thai-province-data..." -ForegroundColor Green

# Try different possible paths
$paths = @(
    "/api/latest/provinces.json",
    "/formats/json/provinces.json",
    "/data/provinces.json"
)

$downloaded = $false
foreach ($path in $paths) {
    $url = "$baseUrl$path"
    Write-Host "Trying: $url" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200 -and $response.Content.Length -gt 100) {
            $outputPath = Join-Path $dataDir "provinces.json"
            $response.Content | Out-File -FilePath $outputPath -Encoding UTF8
            Write-Host "✓ Downloaded provinces.json" -ForegroundColor Green
            $downloaded = $true
            break
        }
    } catch {
        Write-Host "  Failed: $_" -ForegroundColor Red
    }
}

if (-not $downloaded) {
    Write-Host "Warning: Could not download from repository. You may need to manually download the data." -ForegroundColor Yellow
    Write-Host "Repository: https://github.com/kongvut/thai-province-data" -ForegroundColor Yellow
}

Write-Host "`nNote: The data structure should have both 'name_th' and 'name_en' fields." -ForegroundColor Cyan
Write-Host "If the repository structure is different, you may need to adjust the download URLs." -ForegroundColor Cyan

