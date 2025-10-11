# test-health-server.ps1
# Test script for Tab Agent Native Host Health Server

Write-Host "[TEST] Tab Agent Health Server Test Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if native host is running
$process = Get-Process -Name "tabagent-host" -ErrorAction SilentlyContinue
if (!$process) {
    Write-Host "[WARN] Native host is not running!" -ForegroundColor Yellow
    Write-Host "   Start it first: Server\dist\tabagent-host.exe" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "[OK] Native host is running (PID: $($process.Id))" -ForegroundColor Green
Write-Host ""

# Wait a moment for health server to start
Write-Host "[WAIT] Waiting for health server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Test 1: Basic connection
Write-Host "[TEST] Test 1: Basic Connection" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8765/test-connection" -Method Get
    Write-Host "[PASS] Health server is accessible" -ForegroundColor Green
    Write-Host "   Uptime: $($response.uptime_seconds) seconds" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Cannot connect to health server" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "[TIP] Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if port 8765 is blocked by firewall" -ForegroundColor Yellow
    Write-Host "   2. Check Server\native_host.log for errors" -ForegroundColor Yellow
    Write-Host "   3. Try rebuilding: Server\build.bat" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Full health check
Write-Host "[TEST] Test 2: Full Health Check" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8765/health" -Method Get
    Write-Host "[PASS] Health endpoint working" -ForegroundColor Green
    Write-Host "   Process PID: $($health.process.pid)" -ForegroundColor Gray
    Write-Host "   Memory Usage: $($health.process.memory_mb) MB" -ForegroundColor Gray
    Write-Host "   CPU Usage: $($health.process.cpu_percent)%" -ForegroundColor Gray
    Write-Host "   Messages: $($health.native_messaging.message_count)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Health check failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: LM Studio check
Write-Host "[TEST] Test 3: LM Studio Detection" -ForegroundColor Cyan
try {
    $lmstudio = Invoke-RestMethod -Uri "http://localhost:8765/lmstudio/check" -Method Get
    Write-Host "   Installed: $(if ($lmstudio.installed) {'YES'} else {'NO'})" -ForegroundColor Gray
    Write-Host "   Running: $(if ($lmstudio.running) {'YES'} else {'NO'})" -ForegroundColor Gray
    Write-Host "   API Accessible: $(if ($lmstudio.api_accessible) {'YES'} else {'NO'})" -ForegroundColor Gray
    Write-Host "   Models Loaded: $($lmstudio.models.Count)" -ForegroundColor Gray
    if ($lmstudio.path) {
        Write-Host "   Path: $($lmstudio.path)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[FAIL] LM Studio check failed" -ForegroundColor Red
}
Write-Host ""

# Test 4: Log access
Write-Host "[TEST] Test 4: Log File Access" -ForegroundColor Cyan
try {
    $logs = Invoke-RestMethod -Uri "http://localhost:8765/logs/tail/10" -Method Get
    Write-Host "[PASS] Can access logs" -ForegroundColor Green
    Write-Host "   Log file: $($logs.log_file)" -ForegroundColor Gray
    Write-Host "   Total lines: $($logs.total_lines)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Cannot access logs" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Health Server Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "[LINKS] Quick Links:" -ForegroundColor Cyan
Write-Host "   Swagger UI:  http://localhost:8765/docs" -ForegroundColor Blue
Write-Host "   Health API:  http://localhost:8765/health" -ForegroundColor Blue
Write-Host "   LM Studio:   http://localhost:8765/lmstudio/check" -ForegroundColor Blue
Write-Host "   Logs:        http://localhost:8765/logs/tail/50" -ForegroundColor Blue
Write-Host ""
