@echo off
title PULSE-HMS Server Terminator
color 0C
echo ========================================================
echo  Stopping Hospital Management System Servers
echo ========================================================
echo.

echo [1/2] Checking port 8085 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8085 ^| findstr LISTENING 2^>nul') do (
    echo Terminating backend process PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/2] Checking port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    echo Terminating frontend process PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All HMS server processes on port 8085 and 5173 have been stopped.
echo.
pause
