# RepoForge

AI-powered CLI tool that translates natural language commands into GitHub operations.

## Installation

```bash
npm install -g repoforge
```

Or link locally from this repo:

```bash
cd packages/repoforge
npm link
```

## Setup

Run the interactive setup wizard:

```bash
repoforge init
```

This will collect:
- GitHub Personal Access Token
- LM Studio endpoint URL (default: `localhost:1234`)
- Preferred LLM model name
- n8n webhook base URL
- Preferences

## Usage

### Interactive Mode (REPL)

```bash
repoforge
```

### One-shot Mode

```bash
repoforge "create a new private repo called api-gateway"
repoforge "commit everything with message feat: add login"
repoforge "open a PR from dev to main titled Add auth flow"
```

### Pipe Mode

```bash
echo "list all my repos" | repoforge
echo "push to origin main" | repoforge
```

### Flags

| Flag | Description |
|------|-------------|
| `--version, -v` | Show version number |
| `--help, -h` | Show help text |
| `--repo, -r [name]` | Set repo context |
| `--no-confirm` | Skip confirmation prompts |
| `--dry-run` | Show what would happen, don't execute |
| `--raw` | Show raw API response JSON |
| `--model [name]` | Override LLM model |
| `--endpoint [url]` | Override LM Studio endpoint |
| `--verbose` | Show full execution trace |
| `--history` | Show command history |

## Slash Commands (Interactive Mode)

| Command | Description |
|---------|-------------|
| `/help` | Show all slash commands |
| `/repo [name]` | Set active repo context |
| `/branch [name]` | Switch active branch |
| `/status` | Show current session status |
| `/history` | Show last 10 commands |
| `/config` | Show current configuration |
| `/clear` | Clear terminal output |
| `/exit` | Exit RepoForge session |

## Requirements

- **LM Studio** running locally on port 1234 (or configured endpoint)
- **n8n** running locally on port 5678 with RepoForge webhooks configured
- **GitHub Personal Access Token** with `repo`, `workflow`, and `pull_request` scopes
- **Node.js** 18+

## Config File

Location: `~/.repoforge/config.json`

```json
{
  "github": {
    "token": "ghp_xxxxxxxxxxxx",
    "username": "your-github-username",
    "default_visibility": "private"
  },
  "llm": {
    "provider": "lmstudio",
    "endpoint": "http://localhost:1234/v1",
    "model": "mistral-7b-instruct",
    "temperature": 0.2
  },
  "n8n": {
    "webhook_base_url": "http://localhost:5678/webhook"
  },
  "preferences": {
    "confirm_before_execute": true,
    "show_raw_api_response": false,
    "output_color": true,
    "default_branch": "main"
  }
}
```

## n8n Webhook Contract

RepoForge POSTs to: `POST /webhook/repoforge/{action}`

Supported actions:
- `create_repo`
- `commit`
- `push`
- `pull`
- `create_pr`
- `list_repos`
- `list_prs`
- `delete_branch`
- `clone_repo`
- `merge_pr`
- `close_pr`
- `get_status`
