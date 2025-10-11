# start-native-host.ps1
# Start the Tab Agent native host in the background

param(
    [switch]$NoTest,
    [switch]$Foreground
)

Write-Host "[START] Tab Agent Native Host" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if native host executable exists
$exePath = Join-Path $PSScriptRoot "dist\tabagent-host.exe"
if (-not (Test-Path $exePath)) {
    Write-Host "[ERROR] Native host executable not found!" -ForegroundColor Red
    Write-Host "   Expected: $exePath" -ForegroundColor Red
    Write-Host ""
    Write-Host "[TIP] Build it first:" -ForegroundColor Yellow
    Write-Host "   cd Server" -ForegroundColor Yellow
    Write-Host "   .\build.bat" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if already running
$existingProcess = Get-Process -Name "tabagent-host" -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "[INFO] Native host is already running (PID: $($existingProcess.Id))" -ForegroundColor Yellow
    Write-Host "   Port 8765: http://localhost:8765/docs" -ForegroundColor Blue
    Write-Host ""
    Write-Host "[TIP] To stop it: Stop-Process -Id $($existingProcess.Id)" -ForegroundColor Gray
    exit 0
}

# Start the native host
Write-Host "[START] Starting native host..." -ForegroundColor Green
Write-Host "   Path: $exePath" -ForegroundColor Gray

if ($Foreground) {
    # Run in foreground (blocking)
    Write-Host "[MODE] Running in foreground (Press Ctrl+C to stop)" -ForegroundColor Yellow
    Write-Host ""
    & $exePath
} else {
    # Run in background with a job to keep stdin open
    Write-Host "[MODE] Starting in background..." -ForegroundColor Gray
    
    # Create a background job that keeps stdin open
    $job = Start-Job -ScriptBlock {
        param($exePath)
        $process = Start-Process -FilePath $exePath -NoNewWindow -PassThru
        # Keep the process alive by not closing stdin
        $process.WaitForExit()
    } -ArgumentList $exePath
    
    # Wait a moment for process to start
    Start-Sleep -Seconds 1
    
    # Get the actual process
    $process = Get-Process -Name "tabagent-host" -ErrorAction SilentlyContinue
    
    if (-not $process) {
        Write-Host "[ERROR] Process failed to start!" -ForegroundColor Red
        Write-Host "[TIP] Try running in foreground to see errors:" -ForegroundColor Yellow
        Write-Host "   .\start-native-host.ps1 -Foreground" -ForegroundColor Yellow
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
        exit 1
    }

    try {
        Write-Host "[OK] Native host started (PID: $($process.Id))" -ForegroundColor Green
        Write-Host ""
        
        # Wait a moment for health server to start
        Write-Host "[WAIT] Waiting for health server to initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
        # Test if health server is running
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8765/test-connection" -Method Get -TimeoutSec 5
            Write-Host "[OK] Health server is running!" -ForegroundColor Green
            Write-Host "   Uptime: $($response.uptime_seconds) seconds" -ForegroundColor Gray
            Write-Host ""
            Write-Host "[LINKS] Quick Links:" -ForegroundColor Cyan
            Write-Host "   Swagger UI:  http://localhost:8765/docs" -ForegroundColor Blue
            Write-Host "   Health API:  http://localhost:8765/health" -ForegroundColor Blue
            Write-Host "   LM Studio:   http://localhost:8765/lmstudio/check" -ForegroundColor Blue
            Write-Host "   View Logs:   http://localhost:8765/logs/tail/50" -ForegroundColor Blue
            Write-Host ""
        } catch {
            Write-Host "[WARN] Health server not responding yet" -ForegroundColor Yellow
            Write-Host "   It may need a few more seconds to start" -ForegroundColor Gray
            Write-Host ""
        }
        
        # Run full test if not skipped
        if (-not $NoTest) {
            Write-Host "[TEST] Running full test suite..." -ForegroundColor Cyan
            Write-Host ""
            & "$PSScriptRoot\test-health-server.ps1"
        }
        
        Write-Host ""
        Write-Host "[INFO] Native host is running in background (PID: $($process.Id))" -ForegroundColor Cyan
        Write-Host "[LOGS] Log file: $PSScriptRoot\native_host.log" -ForegroundColor Gray
        Write-Host ""
        Write-Host "=======================================" -ForegroundColor Cyan
        Write-Host "[RUNNING] Press Ctrl+C to stop the native host" -ForegroundColor Yellow
        Write-Host "=======================================" -ForegroundColor Cyan
        Write-Host ""
        
        # Keep script running and monitor the process
        try {
            while ($true) {
                Start-Sleep -Seconds 5
                $stillRunning = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
                if (-not $stillRunning) {
                    Write-Host ""
                    Write-Host "[WARN] Native host process stopped unexpectedly!" -ForegroundColor Yellow
                    Write-Host "[INFO] Check logs: $PSScriptRoot\native_host.log" -ForegroundColor Gray
                    break
                }
            }
        } finally {
            Write-Host ""
            Write-Host "[CLEANUP] Stopping native host..." -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
            Remove-Job -Id $job.Id -ErrorAction SilentlyContinue
            Write-Host "[STOPPED] Native host stopped" -ForegroundColor Green
            Write-Host ""
        }
        
    } catch {
        Write-Host "[ERROR] Failed to start native host!" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "[TIP] Check log file: $PSScriptRoot\native_host.log" -ForegroundColor Yellow
        exit 1
    }
}

