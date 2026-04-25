def parse_natural_language(command: str) -> dict:
    """
    Mock LLM parser. In a real scenario, this would call an LLM API 
    (like OpenAI or a local model) to parse the intent.
    """
    cmd = command.lower()
    
    # Delete repo
    if "delete" in cmd and ("repo" in cmd or "project" in cmd):
        parts = cmd.split("repo") if "repo" in cmd else cmd.split("project")
        name = parts[-1].strip() if len(parts) > 1 else cmd.split("delete")[-1].strip()
        for word in ["named", "called", "my", "the"]:
            name = name.replace(word, "").strip()
        return {
            "action": "delete_repo",
            "params": {"name": name},
            "confidence": 0.9,
            "clarification_needed": False
        }

    # Get repo info
    if "get" in cmd and ("repo" in cmd or "info" in cmd) and "star" not in cmd:
        parts = cmd.split("repo") if "repo" in cmd else cmd.split("get")
        name = parts[-1].strip() if len(parts) > 1 else parts[0].strip()
        for word in ["named", "called", "my", "the", "info", "about"]:
            name = name.replace(word, "").strip()
        return {
            "action": "get_repo",
            "params": {"name": name},
            "confidence": 0.9,
            "clarification_needed": False
        }

    # Star repo
    if "star" in cmd and "repo" in cmd:
        name = cmd.split("repo")[-1].strip()
        for word in ["named", "called", "my", "the"]:
            name = name.replace(word, "").strip()
        return {
            "action": "star_repo",
            "params": {"name": name},
            "confidence": 0.9,
            "clarification_needed": False
        }

    # List repos
    if "list" in cmd or "show repos" in cmd or "my repos" in cmd:
        return {
            "action": "list_repos",
            "params": {},
            "confidence": 0.9,
            "clarification_needed": False
        }

    # PROJECT SCAFFOLDING (High Priority)
    if "create" in cmd and ("project" in cmd or "app" in cmd or "template" in cmd or "express" in cmd or "node" in cmd or "react" in cmd):
        ptype = "generic"
        if "node" in cmd: ptype = "node"
        if "express" in cmd: ptype = "expressjs"
        if "react" in cmd: ptype = "react"
        
        # Extract name
        name = "new-project"
        parts = cmd.split("named")
        if len(parts) > 1:
            name = parts[1].strip().split()[0]
        else:
            for keyword in ["project", "app", "template", "express", "node", "react"]:
                if keyword in cmd:
                    parts = cmd.split(keyword)
                    if len(parts) > 1 and parts[1].strip():
                        name = parts[1].strip().split()[0]
                        break
                
        return {"action": "create_project", "params": {"type": ptype, "name": name}, "confidence": 0.9, "clarification_needed": False}
        
    # Create repo (Low Priority)
    if "create" in cmd and ("repo" in cmd or "project" in cmd):
        name = cmd.split("named")[-1].strip() if "named" in cmd else cmd.split("repo")[-1].strip()
        if not name:
            name = "new-repo"
        private = "private" in cmd
        return {
            "action": "create_repo",
            "params": {"name": name, "private": private},
            "confidence": 0.9,
            "clarification_needed": False
        }

    if "push" in cmd:
        return {
            "action": "push",
            "params": {},
            "confidence": 0.9,
            "clarification_needed": False
        }
        
    if "pull" in cmd:
        return {
            "action": "pull",
            "params": {},
            "confidence": 0.9,
            "clarification_needed": False
        }

    if cmd.strip() in ["help", "repoforge help", "/help"]:
        return {
            "action": "help",
            "params": {},
            "confidence": 1.0,
            "clarification_needed": False
        }
        
    # BRANCH MANAGEMENT
    if "branch" in cmd:
        if "create" in cmd or "new" in cmd:
            name = cmd.split("branch")[-1].strip().split()[0] if "branch" in cmd else "new-branch"
            return {"action": "branch_create", "params": {"name": name}, "confidence": 0.9, "clarification_needed": False}
        elif "switch" in cmd or "checkout" in cmd:
            name = cmd.split("branch")[-1].strip().split()[0] if "branch" in cmd else cmd.split()[-1]
            return {"action": "branch_switch", "params": {"name": name}, "confidence": 0.9, "clarification_needed": False}
        elif "list" in cmd or "show" in cmd:
            return {"action": "branch_list", "params": {}, "confidence": 0.9, "clarification_needed": False}
        elif "merge" in cmd:
            name = cmd.split("branch")[-1].strip().split()[0] if "branch" in cmd else cmd.split("merge")[-1].strip().split()[0]
            if "into" in cmd:
                name = cmd.split("merge")[1].split("into")[0].strip().replace("branch", "").strip()
            return {"action": "branch_merge", "params": {"name": name}, "confidence": 0.9, "clarification_needed": False}
        elif "delete" in cmd:
            name = cmd.split("branch")[-1].strip().split()[0]
            return {"action": "branch_delete", "params": {"name": name}, "confidence": 0.9, "clarification_needed": False}

    # LOCAL GIT OPS
    if "init" in cmd or ("initialize" in cmd and "repo" in cmd):
        return {"action": "git_init", "params": {}, "confidence": 0.9, "clarification_needed": False}
    if "commit" in cmd:
        msg = "Auto-commit by RepoForge"
        if "with message" in cmd:
            msg = cmd.split("with message")[-1].strip().strip('"\'')
        elif "message" in cmd:
            msg = cmd.split("message")[-1].strip().strip('"\'')
        return {"action": "git_commit", "params": {"message": msg}, "confidence": 0.9, "clarification_needed": False}
    if ("log" in cmd or "history" in cmd) and "logout" not in cmd:
        return {"action": "git_log", "params": {}, "confidence": 0.9, "clarification_needed": False}
    if "undo" in cmd or "reset" in cmd:
        return {"action": "git_undo", "params": {}, "confidence": 0.9, "clarification_needed": False}
    if "stash" in cmd:
        return {"action": "git_stash", "params": {}, "confidence": 0.9, "clarification_needed": False}

    # GITHUB AUTOMATION (Issues, PRs, Fork)
    if "issue" in cmd:
        if "create" in cmd or "new" in cmd:
            title = cmd.split("issue")[-1].strip()
            if not title: title = "New Issue"
            return {"action": "issue_create", "params": {"title": title}, "confidence": 0.9, "clarification_needed": False}
        elif "list" in cmd or "show" in cmd:
            return {"action": "issue_list", "params": {}, "confidence": 0.9, "clarification_needed": False}
    if "pull request" in cmd or " pr " in cmd:
        if "create" in cmd or "new" in cmd:
            return {"action": "pr_create", "params": {}, "confidence": 0.9, "clarification_needed": False}
    if "fork" in cmd:
        name = cmd.split("fork")[-1].strip().replace("repo", "").strip()
        return {"action": "fork_repo", "params": {"name": name}, "confidence": 0.9, "clarification_needed": False}
    if "health" in cmd:
        name = cmd.split("health")[-1].strip().replace("of", "").replace("repo", "").strip()
        return {"action": "check_health", "params": {"name": name}, "confidence": 0.9, "clarification_needed": False}

    # FALLBACK
    return {
        "action": "unknown",
        "params": {},
        "confidence": 0.1,
        "clarification_needed": True,
        "clarification_prompt": f"I couldn't understand '{command}'. Please rephrase."
    }
