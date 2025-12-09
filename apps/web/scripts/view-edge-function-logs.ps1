# PowerShell script to view Supabase Edge Function logs
param(
    [Parameter(Mandatory=$true)]
    [string]$FunctionName
)

# Check if supabase CLI is available
$supabaseCmd = if (Get-Command supabase -ErrorAction SilentlyContinue) {
    "supabase"
} elseif (Get-Command npx -ErrorAction SilentlyContinue) {
    "npx supabase"
} else {
    Write-Host "ERROR: supabase CLI not found. Please install it or use npx." -ForegroundColor Red
    exit 1
}

Write-Host "Viewing logs for Edge Function: $FunctionName" -ForegroundColor Cyan
Write-Host "Using: $supabaseCmd" -ForegroundColor Gray
Write-Host ""

# View logs
try {
    if ($supabaseCmd -eq "supabase") {
        supabase functions logs $FunctionName --tail
    } else {
        npx supabase functions logs $FunctionName --tail
    }
} catch {
    Write-Host "ERROR: Failed to view logs" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running: $supabaseCmd functions logs $FunctionName" -ForegroundColor Yellow
    exit 1
}

