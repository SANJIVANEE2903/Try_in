# PowerShell Run Guide

This project now supports running backend + new professional frontend on Windows PowerShell.

## 1) One-time install

From repo root:

```powershell
pnpm install --no-frozen-lockfile
```

If PowerShell blocks scripts, run once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 2) Start full stack (recommended)

```powershell
.\run-fullstack.ps1
```

This opens two PowerShell windows:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5175`

## 3) Start separately (optional)

Backend:

```powershell
.\run-backend.ps1
```

Frontend:

```powershell
.\run-frontend.ps1
```

## 4) Health checks

- Backend health: `http://localhost:3000/api/healthz`
- Frontend UI: `http://localhost:5175`

## Notes

- Existing backend source is unchanged.
- New professional frontend is isolated in `artifacts/pro-frontend`.
