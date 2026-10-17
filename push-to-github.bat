@echo off
title Push PULSE HMS to GitHub
color 0B
echo ======================================================================
echo           UPLOADING PULSE HMS CODEBASE TO GITHUB
echo ======================================================================
echo.
echo Destination: https://github.com/sumanthpuli2001/pulse-hospital-management-system.git
echo.
echo If GitHub asks you to sign in, click "Sign in with your browser".
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ======================================================================
    echo      SUCCESS! ALL PROJECT CODE UPLOADED TO GITHUB!
    echo ======================================================================
) else (
    echo Push incomplete. Please check the message above.
)
echo.
pause
