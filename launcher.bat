@echo off
title Discord Game ^& Sampler Badge Tool - Made by @gc3i
color 0c
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ================================================================
    echo  [ERROR] Node.js is not installed or not found in PATH!
    echo  Please install Node.js from https://nodejs.org/ to use this tool.
    echo ================================================================
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\discord-rpc" (
    echo [INFO] Installing required dependencies...
    call npm install
    cls
)

if not exist "dummy_runner.exe" (
    echo [INFO] Building runner component...
    if exist "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
        "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /r:System.Windows.Forms.dll,System.Drawing.dll /target:winexe /out:dummy_runner.exe dummy.cs >nul 2>&1
    ) else if exist "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
        "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" /r:System.Windows.Forms.dll,System.Drawing.dll /target:winexe /out:dummy_runner.exe dummy.cs >nul 2>&1
    )
)

node index.js
exit /b 0
