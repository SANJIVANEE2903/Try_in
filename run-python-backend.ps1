$ErrorActionPreference = "Stop"

Write-Host "Starting Python FastAPI backend on http://localhost:8000" -ForegroundColor Cyan

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path "$repoRoot\apps\backend"

uvicorn main:app --reload --port 8000
