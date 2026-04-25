from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class ParseRequest(BaseModel):
    command: str

class ParseResponse(BaseModel):
    action: str
    params: Dict[str, Any]
    confidence: float
    clarification_needed: bool
    clarification_prompt: Optional[str] = None

class GitHubActionRequest(BaseModel):
    token: str
    action: str
    params: Dict[str, Any]

class ActionResponse(BaseModel):
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
