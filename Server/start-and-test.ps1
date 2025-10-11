# start-and-test.ps1
# Start the native host and test the health server

Write-Host "[START] Tab Agent Native Host Starter & Tester" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
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
    Write-Host "   Do you want to restart it? (Y/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'Y' -or $response -eq 'y') {
        Write-Host "[STOP] Stopping existing process..." -ForegroundColor Yellow
        Stop-Process -Id $existingProcess.Id -Force
        Start-Sleep -Seconds 1
    } else {
        Write-Host "[SKIP] Using existing process" -ForegroundColor Green
        Write-Host ""
        # Jump to testing
        & "$PSScriptRoot\test-health-server.ps1"
        exit 0
    }
}

# Start the native host in background
Write-Host "[START] Starting native host..." -ForegroundColor Green
Write-Host "   Path: $exePath" -ForegroundColor Gray

# Start the process without window
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $exePath
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true
$startInfo.RedirectStandardInput = $true
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true

try {
    $process = [System.Diagnostics.Process]::Start($startInfo)
    Write-Host "[OK] Native host started (PID: $($process.Id))" -ForegroundColor Green
    Write-Host ""
    
    # Wait a moment for health server to start
    Write-Host "[WAIT] Waiting for health server to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # Run the test script
    Write-Host ""
    & "$PSScriptRoot\test-health-server.ps1"
    
} catch {
    Write-Host "[ERROR] Failed to start native host!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[INFO] Native host is running in background (PID: $($process.Id))" -ForegroundColor Cyan
Write-Host "[INFO] To stop it, run: Stop-Process -Id $($process.Id)" -ForegroundColor Cyan
Write-Host "   Or close this terminal to stop it automatically" -ForegroundColor Gray
Write-Host ""

