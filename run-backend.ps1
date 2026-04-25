$ErrorActionPreference = "Stop"

Write-Host "Starting backend on http://localhost:3000" -ForegroundColor Cyan

$env:PORT = "3000"

pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
