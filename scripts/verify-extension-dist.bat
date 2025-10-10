@echo off
echo Verifying extension distribution...

REM Check if TabAgentDist\Extension directory exists
if not exist "TabAgentDist\Extension\" (
    echo ❌ TabAgentDist\Extension directory does not exist
    exit /b 1
)

REM List of essential files that should be in the extension distribution
set file1=manifest.json
set file2=sidepanel.html
set file3=sidepanel.js
set file4=background.js
set file5=content.js

echo Checking for essential files...

REM Count how many files are missing
set missingCount=0

if not exist "TabAgentDist\Extension\%file1%" (
    echo ❌ Missing %file1%
    set /a missingCount+=1
) else (
    echo ✅ Found %file1%
)

if not exist "TabAgentDist\Extension\%file2%" (
    echo ❌ Missing %file2%
    set /a missingCount+=1
) else (
    echo ✅ Found %file2%
)

if not exist "TabAgentDist\Extension\%file3%" (
    echo ❌ Missing %file3%
    set /a missingCount+=1
) else (
    echo ✅ Found %file3%
)

if not exist "TabAgentDist\Extension\%file4%" (
    echo ❌ Missing %file4%
    set /a missingCount+=1
) else (
    echo ✅ Found %file4%
)

if not exist "TabAgentDist\Extension\%file5%" (
    echo ❌ Missing %file5%
    set /a missingCount+=1
) else (
    echo ✅ Found %file5%
)

if %missingCount% == 0 (
    echo.
    echo ✅ Extension distribution verified successfully!
    echo 📁 Distribution location: TabAgentDist\Extension
) else (
    echo.
    echo ❌ Extension distribution verification failed! %missingCount% files missing.
    exit /b 1
)