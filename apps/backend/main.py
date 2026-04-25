from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from schemas import ParseRequest, ParseResponse, GitHubActionRequest, ActionResponse
from services.llm_parser import parse_natural_language
from services.github_api import dispatch_github_action

app = FastAPI(title="RepoForge Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def health_check():
    return {"status": "ok"}

from services import db

@app.get("/api/stats")
def get_stats():
    return db.get_stats()

@app.get("/api/logs")
def get_logs():
    return {"logs": db.get_logs()}

@app.post("/api/parse", response_model=ParseResponse)
def parse_command(request: ParseRequest):
    try:
        result = parse_natural_language(request.command)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat_and_execute(request: ParseRequest):
    try:
        # 1. Parse intent
        parse_result = parse_natural_language(request.command)
        
        if parse_result.get("clarification_needed"):
            return {"status": "clarify", "message": parse_result.get("clarification_prompt"), "data": parse_result}
            
        # 2. Execute action
        action = parse_result.get("action")
        params = parse_result.get("params", {})
        
        # Use a dummy token for the demo SaaS dashboard
        execution_result = dispatch_github_action("demo-token", action, params)
        return execution_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/github/action", response_model=ActionResponse)
def execute_github_action(request: GitHubActionRequest):
    try:
        result = dispatch_github_action(request.token, request.action, request.params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
