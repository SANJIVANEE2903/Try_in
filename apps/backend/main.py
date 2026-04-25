from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time

from schemas import ParseRequest, ParseResponse, GitHubActionRequest, ActionResponse
from services.llm_parser import parse_natural_language
from services.github_api import dispatch_github_action, get_github_user
from services import db

app = FastAPI(title="RepoForge Backend API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def health_check():
    return {"status": "ok", "version": "2.0.0"}

@app.get("/api/stats")
def get_stats():
    return db.get_stats()

@app.get("/api/logs")
def get_logs(limit: int = 50):
    """Return structured audit logs for the Activity page"""
    return {"logs": db.get_logs(limit=limit)}

@app.post("/api/parse", response_model=ParseResponse)
def parse_command(request: ParseRequest):
    try:
        result = parse_natural_language(request.command)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_and_execute(request: ParseRequest, http_request: Request):
    """Web UI chat endpoint - parses and executes in one step"""
    start = time.time()
    try:
        parse_result = parse_natural_language(request.command)
        
        if parse_result.get("clarification_needed"):
            return {"status": "clarify", "message": parse_result.get("clarification_prompt"), "data": parse_result}
            
        action = parse_result.get("action")
        params = parse_result.get("params", {})
        
        execution_result = dispatch_github_action("demo-token", action, params)
        
        duration_ms = int((time.time() - start) * 1000)
        db.add_log(
            action=action,
            message=execution_result.get("message", ""),
            source="web",
            github_user="web-user",
            status=execution_result.get("status", "success"),
            duration_ms=duration_ms
        )
        return execution_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/github/action", response_model=ActionResponse)
async def execute_github_action(request: GitHubActionRequest, http_request: Request):
    """CLI endpoint - executes a pre-parsed action with a real token"""
    start = time.time()
    try:
        # Resolve the real GitHub username for audit trail
        github_user = "cli-user"
        try:
            github_user = get_github_user(request.token) or "cli-user"
        except:
            pass
        
        # Record session on first use
        db.record_session(
            github_user=github_user,
            token=request.token,
            source="cli",
            ip=http_request.client.host if http_request.client else "localhost"
        )
        
        result = dispatch_github_action(request.token, request.action, request.params)
        
        duration_ms = int((time.time() - start) * 1000)
        db.add_log(
            action=request.action,
            message=result.get("message", ""),
            source="cli",
            github_user=github_user,
            status=result.get("status", "success"),
            duration_ms=duration_ms
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
