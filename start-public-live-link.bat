@echo off
title PULSE HMS - Public Live URL Tunnel (Cloudflare)
color 0A
echo ======================================================================
echo           PULSE HOSPITAL MANAGEMENT SYSTEM - LIVE CLOUDFLARE LINK
echo ======================================================================
echo.
echo Starting secure enterprise Cloudflare Edge Tunnel for port 5173...
echo No passwords, no IP verification, and instant global access!
echo.
cloudflared.exe tunnel --url http://127.0.0.1:5173
pause
