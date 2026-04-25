def parse_natural_language(command: str) -> dict:
    """
    Enhanced NLP parser that handles natural language commands,
    synonyms, and follow-up intent queries.
    """
    cmd = command.lower().strip()

    def make(action, params={}, confidence=0.9):
        return {"action": action, "params": params, "confidence": confidence, "clarification_needed": False}

    def clarify(msg=None):
        return {
            "action": "unknown",
            "params": {},
            "confidence": 0.1,
            "clarification_needed": True,
            "clarification_prompt": msg or f"I couldn't understand '{command}'. Try: 'list my repos', 'create repo named my-app', or 'check health of my-repo'."
        }

    # ─── HELP ────────────────────────────────────────────────────────────────
    if cmd in ["help", "repoforge help", "/help", "what can you do", "commands"]:
        return make("help")

    # ─── LIST / SHOW REPOS (includes follow-ups like "give me their names") ──
    list_triggers = [
        "list", "show repos", "my repos", "all repos", "show my repos",
        "what are my repos", "give me their names", "show their names",
        "names of my repos", "what repos", "show all", "fetch repos",
        "get my repos", "display repos", "repositories", "show repos"
    ]
    if any(t in cmd for t in list_triggers):
        return make("list_repos")

    # ─── DELETE REPO ─────────────────────────────────────────────────────────
    if ("delete" in cmd or "remove" in cmd or "destroy" in cmd) and \
       ("repo" in cmd or "project" in cmd or "repository" in cmd):
        parts = cmd.replace("delete", "").replace("remove", "").replace("destroy", "")
        for word in ["repo", "repository", "project", "named", "called", "my", "the", "name"]:
            parts = parts.replace(word, " ")
        name = " ".join(parts.split()).strip() or "unknown"
        return make("delete_repo", {"name": name})

    # ─── GET REPO INFO ───────────────────────────────────────────────────────
    if ("get" in cmd or "info" in cmd or "details" in cmd or "about" in cmd) and \
       ("repo" in cmd or "repository" in cmd) and "star" not in cmd:
        parts = cmd.replace("get", "").replace("info", "").replace("details", "").replace("about", "")
        for word in ["repo", "repository", "named", "called", "my", "the"]:
            parts = parts.replace(word, " ")
        name = " ".join(parts.split()).strip() or "unknown"
        return make("get_repo", {"name": name})

    # ─── STAR REPO ───────────────────────────────────────────────────────────
    if "star" in cmd and ("repo" in cmd or "repository" in cmd):
        parts = cmd.replace("star", "").replace("repo", "").replace("repository", "")
        for word in ["named", "called", "my", "the"]:
            parts = parts.replace(word, " ")
        name = " ".join(parts.split()).strip() or "unknown"
        return make("star_repo", {"name": name})

    # ─── PROJECT SCAFFOLDING ─────────────────────────────────────────────────
    scaffold_keywords = ["project", "app", "template", "express", "node", "react", "scaffold", "generate", "boilerplate"]
    if ("create" in cmd or "make" in cmd or "build" in cmd or "scaffold" in cmd or "generate" in cmd) and \
       any(k in cmd for k in scaffold_keywords):
        ptype = "generic"
        if "node" in cmd: ptype = "node"
        if "express" in cmd: ptype = "expressjs"
        if "react" in cmd: ptype = "react"
        if "next" in cmd: ptype = "nextjs"
        if "python" in cmd or "flask" in cmd: ptype = "python"

        name = "new-project"
        if "named" in cmd:
            name = cmd.split("named")[-1].strip().split()[0]
        elif "called" in cmd:
            name = cmd.split("called")[-1].strip().split()[0]
        else:
            for keyword in scaffold_keywords:
                if keyword in cmd:
                    parts = cmd.split(keyword)
                    if len(parts) > 1 and parts[1].strip():
                        candidate = parts[1].strip().split()[0]
                        if candidate not in ["named", "called", "with", "in"]:
                            name = candidate
                        break
        return make("create_project", {"type": ptype, "name": name})

    # ─── CREATE REPO ─────────────────────────────────────────────────────────
    if ("create" in cmd or "make" in cmd or "new" in cmd or "init" in cmd) and \
       ("repo" in cmd or "repository" in cmd):
        name = "new-repo"
        if "named" in cmd:
            name = cmd.split("named")[-1].strip().split()[0]
        elif "called" in cmd:
            name = cmd.split("called")[-1].strip().split()[0]
        else:
            parts = cmd.split("repo")
            if len(parts) > 1 and parts[-1].strip():
                candidate = parts[-1].strip().split()[0]
                if candidate not in ["named", "called", "with"]:
                    name = candidate
        private = "private" in cmd
        return make("create_repo", {"name": name, "private": private})

    # ─── PUSH ────────────────────────────────────────────────────────────────
    if "push" in cmd and "pull request" not in cmd and " pr " not in cmd:
        return make("push")

    # ─── PULL ────────────────────────────────────────────────────────────────
    if "pull" in cmd and "pull request" not in cmd and " pr " not in cmd:
        return make("pull")

    # ─── BRANCH ──────────────────────────────────────────────────────────────
    if "branch" in cmd:
        if "create" in cmd or "new" in cmd or "make" in cmd:
            parts = cmd.split("branch")[-1].strip().split()
            name = next((w for w in parts if w not in ["named", "called", "new", "create", "called"]), "new-branch")
            return make("branch_create", {"name": name})
        elif "switch" in cmd or "checkout" in cmd or "go to" in cmd:
            parts = cmd.split("branch")[-1].strip().split()
            name = parts[0] if parts else cmd.split()[-1]
            return make("branch_switch", {"name": name})
        elif "list" in cmd or "show" in cmd or "all" in cmd:
            return make("branch_list")
        elif "merge" in cmd:
            name = cmd.split("merge")[-1].strip().replace("branch", "").strip().split()[0] if cmd.split("merge")[-1].strip() else "main"
            return make("branch_merge", {"name": name})
        elif "delete" in cmd or "remove" in cmd:
            parts = cmd.split("branch")[-1].strip().split()
            name = parts[0] if parts else "unknown"
            return make("branch_delete", {"name": name})

    # ─── LOCAL GIT OPS ───────────────────────────────────────────────────────
    if "init" in cmd or ("initialize" in cmd and "repo" in cmd):
        return make("git_init")

    if "commit" in cmd:
        msg = "Auto-commit by RepoForge"
        for marker in ["with message", "message", ":"]:
            if marker in cmd:
                msg = cmd.split(marker)[-1].strip().strip('"\'')
                break
        return make("git_commit", {"message": msg})

    if ("log" in cmd or "history" in cmd or "commits" in cmd) and "logout" not in cmd:
        return make("git_log")

    if "undo" in cmd or ("reset" in cmd and "repo" not in cmd):
        return make("git_undo")

    if "stash" in cmd:
        return make("git_stash")

    # ─── GITHUB AUTOMATION ───────────────────────────────────────────────────
    if "issue" in cmd:
        if "create" in cmd or "new" in cmd or "open" in cmd or "add" in cmd:
            title = cmd.split("issue")[-1].strip() or "New Issue"
            for w in ["create", "new", "open", "add", "a", "an"]:
                title = title.replace(w, "").strip()
            return make("issue_create", {"title": title or "New Issue"})
        return make("issue_list")

    if "pull request" in cmd or " pr " in cmd or cmd.startswith("pr ") or cmd == "pr":
        if "create" in cmd or "open" in cmd or "new" in cmd or "make" in cmd:
            head = ""
            base = "main"
            if "from" in cmd:
                head = cmd.split("from")[-1].split("to")[0].strip()
            if "to" in cmd:
                base = cmd.split("to")[-1].strip().split()[0]
            return make("pr_create", {"head": head, "base": base})

    if "fork" in cmd:
        name = cmd.split("fork")[-1].strip().replace("repo", "").replace("repository", "").strip()
        return make("fork_repo", {"name": name})

    if "health" in cmd or "status" in cmd and "repo" in cmd:
        name = cmd.split("health" if "health" in cmd else "status")[-1]
        for w in ["of", "repo", "repository", "check", "the"]:
            name = name.replace(w, " ")
        name = " ".join(name.split()).strip() or "unknown"
        return make("check_health", {"name": name})

    # ─── FALLBACK ─────────────────────────────────────────────────────────────
    return clarify()
