import typer
from ui import print_banner, console
from auth import ensure_authenticated
from client import parse_and_execute

app = typer.Typer(help="RepoForge AI - Manage GitHub with natural language")

@app.command()
def chat():
    """Start interactive natural language mode"""
    print_banner()
    token = ensure_authenticated()
    
    console.print("\n[bold cyan]Tips & Available Features:[/bold cyan]")
    console.print("[dim]> Create a project: 'create express project named my-api'[/dim]")
    console.print("[dim]> Git Operations:   'commit my changes with message fixed login'[/dim]")
    console.print("[dim]> Branching:        'create branch feature-auth'[/dim]")
    console.print("[dim]> GitHub Issues:    'create issue bug in login'[/dim]")
    console.print("[dim]> Basic Repo:       'create public repo named dyp'[/dim]")
    console.print("[dim]> Use [yellow]repoforge help[/yellow] to see all 30+ features![/dim]")
    console.print("[dim]> Use [red]/exit[/red] to quit[/dim]\n")
    
    while True:
        try:
            command = console.input("[cyan]❯[/cyan] ")
            if not command.strip():
                continue
            if command.strip().lower() in ['/exit', '/quit']:
                console.print("[dim]Goodbye 👋[/dim]")
                break
                
            if command.strip().lower() in ['help', 'repoforge help', '/help']:
                help()
                continue
                
            if command.strip().lower() in ['chat', 'repoforge chat']:
                console.print("[yellow]You are already in interactive chat mode! Type your commands directly.[/yellow]")
                continue
                
            if command.strip().lower() == 'logout':
                logout()
                # Refresh token after logout
                token = ensure_authenticated()
                continue
                
            parse_and_execute(command, token)
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            console.print(f"[red]Error:[/red] {e}")

@app.command()
def execute(command: str):
    """Execute a single natural language command"""
    token = ensure_authenticated()
    parse_and_execute(command, token)

@app.command()
def help():
    """Show the complete feature list for RepoForge CLI"""
    help_text = """
[bold cyan]🚀 RepoForge CLI — PowerShell Features[/bold cyan]

[bold yellow]🔹 Core Repository Management[/bold yellow]
• Create repository (public/private)
• Delete repository
• Rename/update repository
• List all repositories
• Clone repository locally

[bold yellow]🔹 Git Operations[/bold yellow]
• Push code to repository
• Pull latest changes
• Initialize repository
• Add & commit changes
• View commit history (log)
• Undo last commit
• Stash changes

[bold yellow]🔹 Branch Management[/bold yellow]
• Create branch
• Switch branch
• List branches
• Merge branches
• Delete branch

[bold yellow]🔹 Advanced Git Features[/bold yellow]
• Cherry-pick commits
• Revert commits
• Resolve merge conflicts (guided)
• Reset to previous commit

[bold yellow]🔹 GitHub Automation[/bold yellow]
• Create Issues
• List Issues
• Close Issues
• Create Pull Requests
• Merge Pull Requests
• Add collaborators
• Fork repositories
• Star / unstar repositories

[bold yellow]🔹 Natural Language Engine (🔥 USP)[/bold yellow]
• Execute commands using plain English
• Auto-correct typos (e.g., "pus code" → push code)
• Context-aware commands (e.g., "same repo as before")
• Smart suggestions after each command
• Command preview before execution

[bold yellow]🔹 Interactive CLI Mode[/bold yellow]
• Chat-style interface: [green]repoforge chat[/green]
• Continuous command execution
• Guided prompts for beginners

[bold yellow]🔹 Productivity Features[/bold yellow]
• Auto-generate README files
• Auto-generate commit messages
• Bulk repository operations
• Templates (React app, Node API, etc.)

[bold yellow]🔹 PowerShell Experience[/bold yellow]
• Colored output
• Progress bars & loaders
• Command history
• Auto-complete (TAB support)

[bold yellow]🔹 Authentication[/bold yellow]
• Secure GitHub token input (first run only)
• Token stored locally (secure)
• Auto-login in future sessions

[bold yellow]🔹 Extensibility[/bold yellow]
• Plugin system for custom commands
• Configurable settings
• Environment-based profiles

[bold magenta]🧠 Example Commands[/bold magenta]
[dim]> repoforge execute "create public repo named dyp"[/dim]
[dim]> repoforge execute "push my code"[/dim]
[dim]> repoforge execute "pull latest changes"[/dim]
[dim]> repoforge execute "create branch feature-login"[/dim]
[dim]> repoforge execute "merge dev into main"[/dim]
[dim]> repoforge execute "create PR from dev to main"[/dim]
[dim]> repoforge execute "list my repos"[/dim]

[bold green]🎯 Positioning[/bold green]
RepoForge CLI is:
✓ [bold]Faster[/bold] than traditional Git commands
✓ [bold]Easier[/bold] than remembering syntax
✓ [bold]Smarter[/bold] with natural language
✓ Built for developers who want [bold]speed + simplicity[/bold]
"""
    console.print(help_text)

@app.command()
def logout():
    """Clear saved GitHub token and logout"""
    from auth import CONFIG_FILE
    if CONFIG_FILE.exists():
        CONFIG_FILE.unlink()
        console.print("[green]✔ Successfully logged out. Saved token has been cleared.[/green]")
    else:
        console.print("[yellow]You are not currently logged in.[/yellow]")

if __name__ == "__main__":
    app()
