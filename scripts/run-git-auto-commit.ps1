# Run Git Auto-Commit in foreground
$scriptPath = Join-Path $PSScriptRoot "..\git-auto-commit.js"
Write-Host "Starting AuraCare Git Auto-Commit Automation..." -ForegroundColor Cyan
node $scriptPath

