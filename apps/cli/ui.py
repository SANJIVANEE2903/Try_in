from rich.console import Console
from rich.panel import Panel
from rich.text import Text

console = Console()

LOGO = """
  ██████╗ ███████╗██████╗  ██████╗ ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  ██████╔╝█████╗  ██████╔╝██║   ██║█████╗  ██║   ██║██████╔╝██║  ███╗█████╗  
  ██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  
  ██║  ██║███████╗██║     ╚██████╔╝██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
  ╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
"""

def print_banner():
    text = Text(LOGO, style="bold cyan")
    console.print(text)
    console.print("  [bold white]RepoForge AI - Manage GitHub with natural language[/bold white]  [dim]·  v2.0.0[/dim]\n")

def print_action_preview(action: str, params: dict):
    console.print()
    console.print(f"  [bold on blue] ACTION [/bold on blue]  [bold white]{action.replace('_', ' ').title()}[/bold white]")
    console.print()
    for k, v in params.items():
        console.print(f"  [dim]{k.ljust(12)}[/dim][white]{v}[/white]")
    console.print("\n  [dim]" + "─"*66 + "[/dim]")
    
def print_result(result: dict):
    console.print()
    if result.get("status") == "success":
        console.print(f"  [bold green]✔[/bold green] [white]{result.get('message')}[/white]")
        
        # Handle list of repositories
        if result.get("data") and "repos" in result.get("data"):
            console.print()
            for repo in result["data"]["repos"]:
                vis = "[dim]private[/dim]" if repo["private"] else "[blue]public[/blue]"
                console.print(f"  [bold white]•[/bold white] {repo['name'].ljust(25)} {vis}")
                
        if result.get("data") and "url" in result.get("data"):
            console.print(f"  [cyan]🔗[/cyan] [white]{result['data']['url']}[/white]")
    else:
        console.print(f"  [bold red]❌ Error:[/bold red] [white]{result.get('message')}[/white]")
    console.print("\n  [dim]" + "─"*66 + "[/dim]\n")
