$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " PULSE-HMS: Enterprise Hospital Management System" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Launching Spring Boot Backend and React Frontend..." -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/2] Starting Spring Boot Backend (Port 8085)..." -ForegroundColor Green
Start-Process -FilePath "$scriptDir\run-backend.bat"

Start-Sleep -Seconds 4

Write-Host "[2/2] Starting React Frontend (Port 5173)..." -ForegroundColor Green
Start-Process -FilePath "$scriptDir\run-frontend.bat"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Both servers launched successfully!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Frontend Application:   http://localhost:5173" -ForegroundColor White
Write-Host " Backend API & Swagger:  http://localhost:8085/swagger-ui/index.html" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "(Keep the two newly opened windows running during your interview)" -ForegroundColor DarkGray
