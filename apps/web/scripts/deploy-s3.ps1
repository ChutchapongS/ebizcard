# PowerShell script for deploying Next.js static export to AWS S3
# Usage: .\scripts\deploy-s3.ps1

param(
    [string]$BucketName = "",
    [string]$Region = "ap-southeast-1",
    [switch]$DryRun = $false
)

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if bucket name is provided
if ([string]::IsNullOrWhiteSpace($BucketName)) {
    Write-Host "❌ Bucket name is required!" -ForegroundColor Red
    Write-Host "Usage: .\scripts\deploy-s3.ps1 -BucketName 'your-bucket-name' [-Region 'ap-southeast-1'] [-DryRun]" -ForegroundColor Yellow
    exit 1
}

# Check if out directory exists
if (-not (Test-Path "out")) {
    Write-Host "❌ 'out' directory not found. Please run 'npm run build:s3' first." -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Starting S3 deployment..." -ForegroundColor Green
Write-Host "   Bucket: $BucketName" -ForegroundColor Cyan
Write-Host "   Region: $Region" -ForegroundColor Cyan
Write-Host "   Dry Run: $DryRun" -ForegroundColor Cyan
Write-Host ""

# Check if bucket exists
Write-Host "📦 Checking if bucket exists..." -ForegroundColor Yellow
$bucketExists = aws s3 ls "s3://$BucketName" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Bucket does not exist or you don't have access. Creating bucket..." -ForegroundColor Yellow
    if (-not $DryRun) {
        aws s3 mb "s3://$BucketName" --region $Region
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to create bucket" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Bucket created successfully" -ForegroundColor Green
    } else {
        Write-Host "   [DRY RUN] Would create bucket: s3://$BucketName" -ForegroundColor Gray
    }
}

# Enable static website hosting
Write-Host "🌐 Configuring static website hosting..." -ForegroundColor Yellow
if (-not $DryRun) {
    $indexDocument = @"
{
    "IndexDocument": {
        "Suffix": "index.html"
    },
    "ErrorDocument": {
        "Key": "404.html"
    }
}
"@
    $indexDocument | aws s3api put-bucket-website --bucket $BucketName --website-configuration $indexDocument
    Write-Host "✅ Website hosting configured" -ForegroundColor Green
} else {
    Write-Host "   [DRY RUN] Would configure website hosting" -ForegroundColor Gray
}

# Upload files
Write-Host "📤 Uploading files to S3..." -ForegroundColor Yellow
if (-not $DryRun) {
    aws s3 sync "out" "s3://$BucketName" --delete --region $Region --cache-control "public, max-age=31536000, immutable" --exclude "*.html" --exclude "*.json"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to upload static assets" -ForegroundColor Red
        exit 1
    }
    
    # Upload HTML files with no-cache
    aws s3 sync "out" "s3://$BucketName" --delete --region $Region --cache-control "public, max-age=0, must-revalidate" --exclude "*" --include "*.html" --include "*.json"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to upload HTML files" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Files uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "   [DRY RUN] Would sync 'out' directory to s3://$BucketName" -ForegroundColor Gray
}

# Get bucket website URL
Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "   Website URL: http://$BucketName.s3-website-$Region.amazonaws.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Configure CloudFront for HTTPS and custom domain" -ForegroundColor Gray
Write-Host "   2. Set up bucket policy for public read access" -ForegroundColor Gray
Write-Host "   3. Configure CORS if needed" -ForegroundColor Gray

