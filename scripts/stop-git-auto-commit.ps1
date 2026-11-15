# Stop running Git Auto-Commit background process
$projectDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$pidFile = Join-Path $projectDir ".git-auto-commit.pid"

if (Test-Path $pidFile) {
    $procId = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($procId) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction Stop
            Stop-Process -Id $procId -Force
            Write-Host "SUCCESS: Stopped Git Auto-Commit process (PID: $procId)." -ForegroundColor Green
        } catch {
            Write-Host "Process with PID $procId was not running." -ForegroundColor Yellow
        }
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No active Git Auto-Commit PID file found." -ForegroundColor Yellow
}
