$ErrorActionPreference = "Stop"

Write-Host "Starting frontend on http://localhost:5175" -ForegroundColor Cyan

$env:PORT = "5175"
$env:VITE_API_BASE_URL = "http://localhost:3000"

pnpm --filter @workspace/pro-frontend run dev
