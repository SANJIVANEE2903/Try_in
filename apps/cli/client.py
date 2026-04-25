import requests
from ui import console, print_action_preview, print_result

BACKEND_URL = "http://localhost:8000"

def parse_and_execute(command: str, token: str):
    with console.status("[bold cyan]🧠 Understanding your request...[/bold cyan]", spinner="dots"):
        try:
            resp = requests.post(f"{BACKEND_URL}/api/parse", json={"command": command})
            resp.raise_for_status()
            intent = resp.json()
        except requests.exceptions.ConnectionError:
            console.print("[red]Error: Could not connect to backend. Is FastAPI running on port 8000?[/red]")
            return
        except Exception as e:
            console.print(f"[red]Error parsing command:[/red] {e}")
            return
            
    if intent.get("clarification_needed"):
        console.print(f"\n[yellow]Not sure what you mean:[/yellow] {intent.get('clarification_prompt')}")
        return
        
    print_action_preview(intent["action"], intent["params"])
    
    with console.status(f"[bold cyan]⚡ Executing {intent['action']}...[/bold cyan]", spinner="dots"):
        try:
            action_resp = requests.post(
                f"{BACKEND_URL}/api/github/action", 
                json={
                    "token": token,
                    "action": intent["action"],
                    "params": intent["params"]
                }
            )
            action_resp.raise_for_status()
            result = action_resp.json()
        except Exception as e:
            console.print(f"[red]Error executing action:[/red] {e}")
            return
            
    print_result(result)
