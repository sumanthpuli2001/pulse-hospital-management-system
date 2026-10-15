@echo off
title PULSE-HMS Master Launcher
color 0F
cls
echo ========================================================
echo  PULSE-HMS: Enterprise Hospital Management System
echo ========================================================
echo.
echo Launching Spring Boot Backend and React Frontend...
echo.

:: Launch Backend in a separate window
echo [1/2] Starting Spring Boot Backend (Port 8085)...
start "HMS Backend (Port 8085)" cmd /k call "%~dp0run-backend.bat"

:: Delay to allow backend initialization
ping 127.0.0.1 -n 4 >nul 2>&1

:: Launch Frontend in a separate window
echo [2/2] Starting React Frontend (Port 5173)...
start "HMS Frontend (Port 5173)" cmd /k call "%~dp0run-frontend.bat"

echo.
echo ========================================================
echo  Both servers launched successfully!
echo ========================================================
echo  Frontend Application:   http://localhost:5173
echo  Backend API & Swagger:  http://localhost:8085/swagger-ui/index.html
echo ========================================================
echo.
echo (Keep the two newly opened CMD windows running during your interview)
echo.
pause
