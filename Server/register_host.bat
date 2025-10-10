@echo off
setlocal

REM Get the current directory
set "HOST_DIR=%~dp0"
set "HOST_MANIFEST=%HOST_DIR%com.tabagent.host.json"

REM Check if manifest exists
if not exist "%HOST_MANIFEST%" (
    echo Error: Native messaging manifest not found at %HOST_MANIFEST%
    pause
    exit /b 1
)

REM Use the known extension ID
set EXT_ID=fkkeoobeahalebjpbockfedlncckobjb
echo Using extension ID: %EXT_ID%

REM Update the manifest with the actual extension ID
echo Updating manifest with extension ID...
powershell -Command "(gc '%HOST_MANIFEST%') -replace 'YOUR_EXTENSION_ID_HERE', '%EXT_ID%' | Out-File -encoding ASCII '%HOST_MANIFEST%'"

REM Register the native messaging host
echo Registering native messaging host...
set "REG_KEY=HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.tabagent.host"
reg add "%REG_KEY%" /ve /t REG_SZ /d "%HOST_MANIFEST%" /f

if %errorlevel% equ 0 (
    echo Native messaging host registered successfully!
    echo.
    echo Host manifest: %HOST_MANIFEST%
    echo Registry key: %REG_KEY%
    echo.
    echo Note: You may need to update the 'path' field in the manifest
    echo to point to the actual executable location.
) else (
    echo Error: Failed to register native messaging host
)

pause