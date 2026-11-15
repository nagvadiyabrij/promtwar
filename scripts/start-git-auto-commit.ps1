# Start Git Auto-Commit as a background background process
$projectDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$scriptFile = Join-Path $projectDir "git-auto-commit.js"
$logFile = Join-Path $projectDir "logs\git-auto-commit.log"
$pidFile = Join-Path $projectDir ".git-auto-commit.pid"

if (Test-Path $pidFile) {
    $existingPid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
        Write-Host "Git Auto-Commit is ALREADY running with PID: $existingPid" -ForegroundColor Yellow
        exit 0
    } else {
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Launching AuraCare Git Auto-Commit in Background " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Project Directory: $projectDir"
Write-Host "Interval:          Every 10 minutes"
Write-Host "Log File:          $logFile"

$process = Start-Process -FilePath "node" -ArgumentList "`"$scriptFile`"" -WorkingDirectory $projectDir -PassThru -WindowStyle Hidden

if ($process -and $process.Id) {
    Set-Content -Path $pidFile -Value $process.Id
    Write-Host "SUCCESS: Automation started in background (PID: $($process.Id))" -ForegroundColor Green
    Write-Host "Check status anytime with: npm run git:status" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Failed to launch background process." -ForegroundColor Red
}

