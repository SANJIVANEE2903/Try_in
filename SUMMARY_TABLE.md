# RepoForge Supported Actions & Features

This table lists all the core GitHub/Git features supported by the RepoForge CLI, the natural language intents they map to, and how they execute.

| Feature / Action | Example Prompts | Execution Context | Internal Action Code | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Pull Changes** | *"pull latest changes"*<br>*"git pull"* | Local Git | `pull` | Safely pulls the latest commits from the remote repository. Handles merge conflicts and alerts if no remote exists. |
| **Push Commits** | *"push my code"*<br>*"upload to github"* | Local Git | `push` | Pushes local commits to GitHub. If no remote exists, it interactively prompts you to link the repo automatically. |
| **Create Repo** | *"create a new private repo called my-app"* | n8n / GitHub API | `create_repo` | Sends a payload to n8n to create a new remote repository on your GitHub account. |
| **Create Pull Request** | *"open a PR for this branch"*<br>*"create a pull request"* | n8n / GitHub API | `create_pr` | Sends a payload to n8n to open a Pull Request. Checks if the local repo has a remote first. |
| **Get Issues** | *"what are the open issues?"*<br>*"list bugs"* | n8n / GitHub API | `get_issues` | Fetches a list of open issues for the current repository via n8n. |
| **Create Issue** | *"create a bug issue for the login page"* | n8n / GitHub API | `create_issue` | Creates a new issue with a title and description on the remote repository. |
| **Add Collaborator** | *"invite @username to this repo"* | n8n / GitHub API | `add_collaborator` | Sends an invite to another GitHub user to collaborate on the project. |
| **Switch Directory** | `cd my-folder`<br>`/cd` | Local File System | `/cd` command | Natively switches the current working directory, updating the Git context. Supports fuzzy finding. |

## How it works:
- **Local Git Actions (`push`, `pull`, `/cd`)** execute extremely quickly directly on your machine without requiring network calls to n8n.
- **GitHub API Actions (`create_repo`, `create_pr`, etc.)** are parsed by the local LLM and sent as a structured JSON payload to your n8n Webhook, which then executes the GitHub node.
