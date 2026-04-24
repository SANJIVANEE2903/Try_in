# RepoForge - Working Features

This document outlines all the user-facing features currently active and functional within the **RepoForge CLI**.

## 1. Natural Language Interface
- **Command Parsing**: Type plain English commands (e.g., "create a new repo called my-app", "pull latest changes", "push my code to main").
- **Intent Extraction**: The CLI uses a local LLM via LM Studio to understand your intent and map it to specific GitHub or Git actions without needing exact syntax.

## 2. Interactive Setup Wizard (`repoforge init`)
- **First-Time Setup**: Automatically runs on first launch if config is missing.
- **Guided Configuration**: Collects your GitHub Personal Access Token, GitHub Username, n8n Webhook URL, and LM Studio Endpoint.
- **Token Validation**: Safely validates your GitHub token during setup to ensure you have the required permissions.

## 3. Local Git Integration (Bypassing n8n)
These features execute directly on your local machine for maximum speed and reliability:
- **Smart Git Context**: The CLI prompt always knows what repository and branch you are currently in.
- **Native `/cd` Command**: 
  - Switch directories instantly via `/cd <path>`.
  - Type `/cd` without arguments to launch an interactive fuzzy-finder to easily select a folder.
- **Push Action (`push`)**: 
  - Commits and pushes your code locally.
  - **Interactive Remote Linking**: If you try to push a repository that hasn't been linked to GitHub yet, it will detect the missing remote and interactively ask if you want to link it, using your saved GitHub username.
- **Pull Action (`pull`)**: 
  - Pulls the latest changes from the remote repository.
  - Gracefully handles and alerts you to merge conflicts or missing remotes.

## 4. GitHub Automation (via n8n)
These features are parsed locally and sent to your configured n8n webhook to automate GitHub API operations:
- **Create Repository (`create_repo`)**: Creates new remote repositories on GitHub.
- **Create Pull Request (`create_pr`)**: Automates PR creation on GitHub (requires the local branch to be pushed to the remote first).
- **Get Issues (`get_issues`)**: Fetches and summarizes issues for a repository.
- **Create Issue (`create_issue`)**: Opens new issues on a repository.
- **Add Collaborator (`add_collaborator`)**: Invites other GitHub users to your repository.

## 5. Developer Experience (DX)
- **Interactive REPL**: A persistent chat-like session where you can chain commands.
- **Slash Commands**: Quick shortcuts like `/help`, `/exit`, and `/cd`.
- **Beautiful UI**: Cyan accents, structured layouts, and smooth loading spinners keep the experience feeling premium and responsive.
- **Pipe Mode**: You can pipe commands directly to the CLI for scripting (e.g., `echo "push my changes" | repoforge`).
- **Debugging**: Use the `--debug` or `--verbose` flags to see the raw API responses and execution trace for troubleshooting.
