import subprocess
from typing import Tuple

def run_cmd(cmd: str) -> Tuple[bool, str]:
    try:
        result = subprocess.run(
            cmd, shell=True, check=True, 
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def git_push() -> str:
    success, output = run_cmd("git push")
    if not success:
        raise Exception(f"Git push failed: {output}")
    return "Pushed successfully."

def git_pull() -> str:
    success, output = run_cmd("git pull")
    if not success:
        raise Exception(f"Git pull failed: {output}")
    return "Pulled successfully."

def git_init() -> str:
    success, output = run_cmd("git init")
    if not success:
        raise Exception(f"Git init failed: {output}")
    return "Initialized empty Git repository."

def git_commit(message: str = "Auto-commit by RepoForge") -> str:
    run_cmd("git add .")
    success, output = run_cmd(f'git commit -m "{message}"')
    if not success:
        # Might just be nothing to commit
        if "nothing to commit" in output:
            return "Nothing to commit, working tree clean."
        raise Exception(f"Git commit failed: {output}")
    return f"Committed changes: '{message}'"

def git_log() -> str:
    success, output = run_cmd("git log -n 5 --oneline")
    if not success:
        raise Exception(f"Git log failed: {output}")
    return f"Recent commits:\n{output}"

def git_undo() -> str:
    success, output = run_cmd("git reset HEAD~1")
    if not success:
        raise Exception(f"Git undo failed: {output}")
    return "Undid last commit (kept changes locally)."

def git_stash() -> str:
    success, output = run_cmd("git stash")
    if not success:
        raise Exception(f"Git stash failed: {output}")
    return "Stashed local changes."

def branch_create(name: str) -> str:
    success, output = run_cmd(f"git checkout -b {name}")
    if not success:
        raise Exception(f"Failed to create branch: {output}")
    return f"Created and switched to branch '{name}'."

def branch_switch(name: str) -> str:
    success, output = run_cmd(f"git checkout {name}")
    if not success:
        raise Exception(f"Failed to switch branch: {output}")
    return f"Switched to branch '{name}'."

def branch_list() -> str:
    success, output = run_cmd("git branch")
    if not success:
        raise Exception(f"Failed to list branches: {output}")
    return f"Branches:\n{output}"

def branch_merge(name: str) -> str:
    success, output = run_cmd(f"git merge {name}")
    if not success:
        raise Exception(f"Failed to merge branch: {output}")
    return f"Merged branch '{name}' into current branch."

def branch_delete(name: str) -> str:
    success, output = run_cmd(f"git branch -d {name}")
    if not success:
        raise Exception(f"Failed to delete branch: {output}")
    return f"Deleted branch '{name}'."

def resolve_conflicts(strategy: str = "ours") -> str:
    """
    Mocked guided conflict resolution. 
    In a real app, this would iterate through conflicted files.
    """
    if strategy == "ours":
        run_cmd("git checkout --ours .")
        run_cmd("git add .")
        return "Conflicts resolved using 'ours' strategy."
    elif strategy == "theirs":
        run_cmd("git checkout --theirs .")
        run_cmd("git add .")
        return "Conflicts resolved using 'theirs' strategy."
    return "Conflict resolution started. Please manually edit the files with markers."
