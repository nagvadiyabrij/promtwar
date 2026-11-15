# Check Git Auto-Commit status and print recent logs
$projectDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$scriptFile = Join-Path $projectDir "git-auto-commit.js"
$logFile = Join-Path $projectDir "logs\git-auto-commit.log"

node $scriptFile --status

if (Test-Path $logFile) {
    Write-Host "Recent Automation Activity (Last 10 lines of logs):" -ForegroundColor Cyan
    Get-Content $logFile -Tail 10
}

