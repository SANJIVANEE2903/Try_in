import os
import json
from pathlib import Path
from rich.console import Console
from rich.prompt import Prompt
from dotenv import load_dotenv

console = Console()
CONFIG_DIR = Path.home() / ".repoforge_v2"
CONFIG_FILE = CONFIG_DIR / "config.json"

import requests

def validate_token(token: str) -> bool:
    """Check if token is valid with GitHub"""
    if not token or len(token) < 10: return False
    try:
        resp = requests.get("https://api.github.com/user", headers={"Authorization": f"token {token}"}, timeout=5)
        return resp.status_code == 200
    except:
        return False

def ensure_authenticated() -> str:
    # 1. First check for environment variable
    load_dotenv()
    env_token = os.getenv("GITHUB_TOKEN")
    if env_token and validate_token(env_token):
        return env_token

    # 2. Then check config file
    if not CONFIG_DIR.exists():
        CONFIG_DIR.mkdir(parents=True)
        
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r") as f:
            try:
                config = json.load(f)
                saved_token = config.get("github_token")
                if saved_token and validate_token(saved_token):
                    # Ask if they want to use this token or enter a new one
                    console.print(f"\n[green]✔ Found valid saved token.[/green]")
                    use_saved = Prompt.ask("Use saved token?", choices=["y", "n"], default="y")
                    if use_saved == "y":
                        return saved_token
            except:
                pass
                
    console.print("\n[bold cyan]◆ GitHub Authentication Required[/bold cyan]")
    console.print("[dim]Please enter your GitHub Personal Access Token to start the session.[/dim]")
    
    while True:
        token = Prompt.ask("Token", password=True)
        if validate_token(token):
            with open(CONFIG_FILE, "w") as f:
                json.dump({"github_token": token}, f)
            console.print("[green]✔ Token validated and saved successfully.[/green]")
            return token
        else:
            console.print("[red]✗ Invalid token. Please make sure it has 'repo' permissions.[/red]")
