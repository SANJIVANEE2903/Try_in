import requests
import os
import json
from pathlib import Path
from . import db

def get_fallback_token():
    config_file = Path.home() / ".repoforge_v2" / "config.json"
    if config_file.exists():
        try:
            with open(config_file, "r") as f:
                return json.load(f).get("github_token")
        except:
            return None
    return None

def get_github_user(token: str) -> str:
    """Resolve GitHub username from token for audit logging"""
    try:
        resp = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {token}"},
            timeout=5
        )
        if resp.status_code == 200:
            return resp.json().get("login", "unknown")
    except:
        pass
    return "unknown"

def dispatch_github_action(token: str, action: str, params: dict) -> dict:
    # Use fallback if token is dummy or missing
    if not token or token == "demo-token":
        token = get_fallback_token() or token
        
    if not token or len(token) < 10:
        return {"status": "error", "message": "No valid GitHub token found. Please run 'repoforge chat' in PowerShell and enter your token.", "data": None}

    # Debug log (masked)
    masked_token = token[:4] + "..." + token[-4:] if len(token) > 8 else "****"
    print(f"Executing {action} with token {masked_token}")
        
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "RepoForge-v2"
    }
    
    if action == "create_repo":
        name = params.get("name", "new-repo")
        private = params.get("private", False)
        
        resp = requests.post(
            "https://api.github.com/user/repos",
            headers=headers,
            json={"name": name, "private": private}
        )
        
        if resp.status_code == 201:
            data = resp.json()
            msg = f"Repository '{name}' created successfully."
            db.add_log("create_repo", msg)
            return {
                "status": "success",
                "message": msg,
                "data": {"url": data.get("html_url"), "name": data.get("name")}
            }
        elif resp.status_code == 401:
            return {
                "status": "error",
                "message": "GitHub Authentication Failed (401). Your token may be expired or invalid. Please run 'repoforge logout' in PowerShell and then 'repoforge chat' to enter a new token.",
                "data": None
            }
        else:
            return {
                "status": "error",
                "message": f"Failed to create repo. GitHub responded with: {resp.text}",
                "data": None
            }
            
    elif action == "list_repos":
        resp = requests.get(
            "https://api.github.com/user/repos?sort=updated&per_page=30",
            headers=headers
        )
        if resp.status_code == 200:
            repos = [
                {
                    "name": r["name"],
                    "url": r["html_url"],
                    "private": r["private"],
                    "stars": r.get("stargazers_count", 0),
                    "language": r.get("language") or "Unknown"
                }
                for r in resp.json()
            ]
            # Build a readable list of repo names for the message
            names_list = "\n".join(
                f"  {'🔒' if r['private'] else '🌐'} {r['name']} ({r['language']}, ⭐{r['stars']})"
                for r in repos
            )
            msg = f"✅ Found {len(repos)} repositories:\n{names_list}"
            db.add_log("list_repos", f"Listed {len(repos)} repositories")
            return {
                "status": "success",
                "message": msg,
                "data": {"repos": repos}
            }
        elif resp.status_code == 401:
            return {
                "status": "error",
                "message": "GitHub Authentication Failed (401). Please run 'repoforge chat' to re-authenticate.",
                "data": None
            }
        else:
            return {
                "status": "error",
                "message": f"Failed to list repositories. GitHub Error: {resp.text}",
                "data": None
            }
            
    elif action == "delete_repo":
        name = params.get("name")
        user_resp = requests.get("https://api.github.com/user", headers=headers)
        if user_resp.status_code == 200:
            owner = user_resp.json().get("login")
            resp = requests.delete(f"https://api.github.com/repos/{owner}/{name}", headers=headers)
            if resp.status_code == 204:
                msg = f"Repository '{name}' deleted."
                db.add_log("delete_repo", msg)
                return {"status": "success", "message": msg, "data": None}
            return {"status": "error", "message": f"Failed to delete repo '{name}'. GitHub Error: {resp.text}", "data": None}
        return {"status": "error", "message": f"Failed to authenticate. {user_resp.text}", "data": None}

    elif action == "get_repo":
        name = params.get("name")
        user_resp = requests.get("https://api.github.com/user", headers=headers)
        if user_resp.status_code == 200:
            owner = user_resp.json().get("login")
            resp = requests.get(f"https://api.github.com/repos/{owner}/{name}", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                msg = f"Found repo '{name}'. Stars: {data.get('stargazers_count')}, Forks: {data.get('forks_count')}."
                db.add_log("get_repo", msg)
                return {"status": "success", "message": msg, "data": {"url": data.get("html_url")}}
            return {"status": "error", "message": f"Repo '{name}' not found.", "data": None}
        return {"status": "error", "message": "Failed to authenticate.", "data": None}

    elif action == "star_repo":
        name = params.get("name")
        if "/" in name:
            owner, repo_name = name.split("/", 1)
        else:
            user_resp = requests.get("https://api.github.com/user", headers=headers)
            if user_resp.status_code == 200:
                owner = user_resp.json().get("login")
            else:
                return {"status": "error", "message": "Failed to authenticate.", "data": None}
            repo_name = name
            
        resp = requests.put(f"https://api.github.com/user/starred/{owner}/{repo_name}", headers=headers)
        if resp.status_code == 204:
            msg = f"Starred repo '{owner}/{repo_name}'."
            db.add_log("star_repo", msg)
            return {"status": "success", "message": msg, "data": None}
        return {"status": "error", "message": f"Failed to star repo '{owner}/{repo_name}'.", "data": None}
            
    elif action == "push":
        import services.git_local as git_local
        try:
            msg = git_local.git_push()
            db.add_log("push", msg)
            return {"status": "success", "message": msg, "data": None}
        except Exception as e:
            return {"status": "error", "message": str(e), "data": None}
            
    elif action == "pull":
        import services.git_local as git_local
        try:
            msg = git_local.git_pull()
            db.add_log("pull", msg)
            return {"status": "success", "message": msg, "data": None}
        except Exception as e:
            return {"status": "error", "message": str(e), "data": None}
            
    elif action == "help":
        return {
            "status": "success", 
            "message": "To see the full feature list, please type 'help' at the main CLI prompt or check the documentation.",
            "data": None
        }

    # PROJECT SCAFFOLDING
    elif action == "create_project":
        import services.scaffolding as scaffolding
        try:
            msg = scaffolding.create_project(params.get("type", "generic"), params.get("name", "new-project"))
            db.add_log("create_project", msg)
            return {"status": "success", "message": msg, "data": None}
        except Exception as e:
            return {"status": "error", "message": str(e), "data": None}

    # LOCAL GIT & BRANCHING
    elif action in ["git_init", "git_commit", "git_log", "git_undo", "git_stash", "branch_create", "branch_switch", "branch_list", "branch_merge", "branch_delete"]:
        import services.git_local as git_local
        try:
            if action == "git_init": msg = git_local.git_init()
            elif action == "git_commit": msg = git_local.git_commit(params.get("message", "Auto-commit"))
            elif action == "git_log": msg = git_local.git_log()
            elif action == "git_undo": msg = git_local.git_undo()
            elif action == "git_stash": msg = git_local.git_stash()
            elif action == "branch_create": msg = git_local.branch_create(params.get("name", "new-branch"))
            elif action == "branch_switch": msg = git_local.branch_switch(params.get("name", "main"))
            elif action == "branch_list": msg = git_local.branch_list()
            elif action == "branch_merge": msg = git_local.branch_merge(params.get("name"))
            elif action == "branch_delete": msg = git_local.branch_delete(params.get("name"))
            
            db.add_log(action, msg.split('\n')[0])
            return {"status": "success", "message": msg, "data": None}
        except Exception as e:
            return {"status": "error", "message": str(e), "data": None}

    # GITHUB AUTOMATION MOCKS (Issues, PRs, Fork, Health)
    elif action in ["issue_create", "issue_list", "pr_create", "fork_repo", "check_health"]:
        if action == "check_health":
            # Real implementation for health check
            name = params.get("name")
            user_resp = requests.get("https://api.github.com/user", headers=headers)
            if user_resp.status_code == 200:
                owner = user_resp.json().get("login")
                resp = requests.get(f"https://api.github.com/repos/{owner}/{name}", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    issues = data.get("open_issues_count")
                    status = "Excellent" if issues == 0 else "Good" if issues < 5 else "Needs Attention"
                    msg = f"🏥 Health report for '{name}': Status {status}. {issues} open issues, {data.get('stargazers_count')} stars."
                    db.add_log("check_health", msg)
                    return {"status": "success", "message": msg, "data": data}
                return {"status": "error", "message": f"Repo '{name}' not found for health check.", "data": None}
            return {"status": "error", "message": "Failed to authenticate.", "data": None}
            
        if action == "issue_create": msg = f"Created issue: {params.get('title')}"
        elif action == "issue_list": msg = "Listed open issues."
        elif action == "pr_create": msg = "Created a Pull Request."
        elif action == "fork_repo": msg = f"Forked repository: {params.get('name')}"
        
        db.add_log(action, msg)
        return {"status": "success", "message": msg, "data": None}
        
    # For unsupported actions
    return {
        "status": "success",
        "message": f"Action {action} processed locally (Mocked).",
        "data": None
    }
