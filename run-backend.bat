@echo off
title HMS - Spring Boot Backend (Port 8085)
color 0B
echo ========================================================
echo  Hospital Management System - Spring Boot Backend
echo  Port: 8085
echo  Swagger UI: http://localhost:8085/swagger-ui/index.html
echo ========================================================
echo.

cd /d "%~dp0backend"

:: Automatically ensure JAVA_HOME is set
if not defined JAVA_HOME (
    if exist "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot" (
        set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
    )
)
if defined JAVA_HOME (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
    echo [OK] Using Java at: %JAVA_HOME%
)

:: Free port 8085 if already occupied by an old process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8085 ^| findstr LISTENING 2^>nul') do (
    echo [INFO] Releasing port 8085 from previous process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

:: Launch Spring Boot using bundled Maven or system Maven
set "MVN_CMD=C:\Users\Sumanth Puli\.gemini\antigravity\scratch\mvn\apache-maven-3.9.6\bin\mvn.cmd"
if exist "%MVN_CMD%" (
    echo [INFO] Starting Spring Boot with Maven...
    call "%MVN_CMD%" spring-boot:run
) else (
    echo [INFO] Starting Spring Boot with system Maven...
    call mvn spring-boot:run
)

echo.
echo [SERVER STOPPED]
pause
