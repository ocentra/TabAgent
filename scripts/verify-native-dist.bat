@echo off
echo Verifying native app distribution...

REM Check if TabAgentDist\NativeApp directory exists
if not exist "TabAgentDist\NativeApp\" (
    echo ❌ TabAgentDist\NativeApp directory does not exist
    exit /b 1
)

REM List of essential files that should be in the native app distribution
set file1=install.sh
set file2=install.ps1
set file3=tabagent-host.exe

echo Checking for essential files...

REM Count how many files are missing
set missingCount=0

if not exist "TabAgentDist\NativeApp\%file1%" (
    echo ❌ Missing %file1%
    set /a missingCount+=1
) else (
    echo ✅ Found %file1%
)

if not exist "TabAgentDist\NativeApp\%file2%" (
    echo ❌ Missing %file2%
    set /a missingCount+=1
) else (
    echo ✅ Found %file2%
)

if not exist "TabAgentDist\NativeApp\%file3%" (
    echo ❌ Missing %file3%
    set /a missingCount+=1
) else (
    echo ✅ Found %file3%
)

if %missingCount% == 0 (
    echo.
    echo ✅ Native app distribution verified successfully!
    echo 📁 Distribution location: TabAgentDist\NativeApp
) else (
    echo.
    echo ❌ Native app distribution verification failed! %missingCount% files missing.
    exit /b 1
)