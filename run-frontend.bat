@echo off
title HMS - React Frontend (Port 5173)
color 0A
echo ========================================================
echo  Hospital Management System - React Frontend
echo  URL: http://localhost:5173
echo ========================================================
echo.

cd /d "%~dp0frontend"

:: Free port 5173 if already occupied by an old process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    echo [INFO] Releasing port 5173 from previous process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

:: Ensure Node and npm are in PATH
set "NODE_DIR=C:\Users\Sumanth Puli\.gemini\antigravity\scratch\node\node-v20.18.0-win-x64"
if exist "%NODE_DIR%" (
    set "PATH=%NODE_DIR%;%PATH%"
    echo [OK] Using Node.js at: %NODE_DIR%
    call "%NODE_DIR%\npm.cmd" run dev
) else (
    echo [INFO] Using system Node.js...
    call npm run dev
)

echo.
echo [SERVER STOPPED]
pause
