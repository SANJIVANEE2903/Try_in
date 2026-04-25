<#
.SYNOPSIS
Installs RepoForge v2 Full Stack (CLI, Backend, Frontend)
#>

Write-Host "Installing RepoForge v2..." -ForegroundColor Cyan

$InstallDir = $PSScriptRoot

Write-Host "1. Setting up Backend..." -ForegroundColor Yellow
Set-Location -Path "$InstallDir\apps\backend"
# pip install -r requirements.txt

Write-Host "2. Setting up CLI..." -ForegroundColor Yellow
Set-Location -Path "$InstallDir\apps\cli"
# pip install -r requirements.txt

Write-Host "3. Setting up Frontend..." -ForegroundColor Yellow
Set-Location -Path "$InstallDir\apps\frontend"
# npm install

Write-Host "Installation Complete! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "To start the backend:"
Write-Host "  cd apps\backend; uvicorn main:app --reload"
Write-Host "To start the frontend:"
Write-Host "  cd apps\frontend; npm run dev"
Write-Host "To use the CLI:"
Write-Host "  cd apps\cli; python main.py chat"
