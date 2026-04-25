$ErrorActionPreference = "Stop"

Write-Host "Opening backend and frontend in separate PowerShell windows..." -ForegroundColor Cyan

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$repoRoot\run-backend.ps1`""
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$repoRoot\run-python-backend.ps1`""
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$repoRoot\run-frontend.ps1`""

Write-Host "Done. Node Backend: http://localhost:3000, Python Backend: http://localhost:8000, Frontend: http://localhost:5175" -ForegroundColor Green
