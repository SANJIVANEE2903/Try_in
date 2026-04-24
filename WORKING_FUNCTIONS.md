# RepoForge - Working Functions Documentation

This document provides a comprehensive overview of all the working functions and core logic implemented in the **RepoForge CLI**.

## 1. CLI Core & REPL (`packages/repoforge/src/cli/repl.js`)

This file is the heart of the interactive CLI, managing the prompt loop, directory switching, and local Git operations.

### Core Functions:
- **`startRepl(config)`**
  Starts the interactive Read-Eval-Print Loop. It captures user input, displays the contextual prompt (showing current repo and branch), routes slash commands, and delegates natural language to the LLM.

- **`handleSlash(input)`**
  Intercepts and processes local slash commands to bypass the LLM.
  - `/exit`: Exits the application.
  - `/help`: Displays available commands.
  - `/cd <path>`: Switches the local directory natively.
  - `/cd` (no args): Opens an interactive, fuzzy-search folder picker.

### Git Context & Guardrails:
- **`detectLocalGit(dir)`**
  Executes synchronous Git commands to detect if the current directory is a repository. Returns an object containing:
  - `isRepo`: Boolean.
  - `repoName`: The folder name or origin remote name.
  - `branch`: The current active branch.
  - `hasRemote`: Boolean indicating if `origin` is configured.

- **`promptForRemote(cwd)`**
  An interactive guard triggered during `push` or `create_pr` actions if no remote exists. It prompts the user to link their local repository to GitHub by dynamically constructing a GitHub URL using their saved username.

### Local Git Action Handlers:
- **`pull` Handler**
  Executes `git pull` directly in the local terminal. Gracefully handles merge conflicts, missing remotes, and outputs results using the RepoForge standard UI format.
- **`push` Handler**
  Executes `git push` directly in the local terminal. Automatically intercepts missing remotes using `promptForRemote`.

---

## 2. LLM Intent Parser (`packages/repoforge/src/llm/parser.js`)

Parses raw LLM text responses into structured JSON action objects.

- **`parseLLMResponse(text)`**
  Uses Regex to extract intent blocks (e.g., `[ACTION] push`). Validates the action against the `VALID_ACTIONS` set. Returns a structured object: `{ action: 'push', repo: '...', branch: '...' }`.

---

## 3. Configuration Management (`packages/repoforge/src/config/`)

Handles the initialization, loading, and authentication of the user's local setup.

- **`init.js -> runSetup()`**
  Guides the user through an interactive prompt to collect their `GITHUB_TOKEN`, `GITHUB_USERNAME`, `N8N_WEBHOOK_URL`, and LM Studio configurations. Saves this to `~/.repoforge/config.json`.
- **`loader.js -> loadConfig()`**
  Reads the `config.json` file and ensures all required fields are present before starting the CLI.
- **`auth.js -> validateGitHubToken(token)`**
  Makes a test request to the GitHub API to ensure the provided Personal Access Token is valid and has the correct permissions.

---

## 4. n8n Communication (`packages/repoforge/src/n8n/webhook.js`)

Handles sending commands to the n8n automation backend.

- **`sendToWebhook(config, payload)`**
  Fires an HTTP POST request to the user's configured `N8N_WEBHOOK_URL`. Sends the parsed action payload (like `create_pr` or `create_repo`) for the n8n workflow to process and execute against the GitHub API.

---

## 5. UI & Rendering (`packages/repoforge/src/cli/renderer.js`)

Provides standard, beautiful terminal output across the application.

- **`printWelcome()`**: Renders the ASCII art logo and metadata.
- **`printConfig(config)`**: Safely displays current configuration (masking the GitHub token).
- **`startSpinner(text)` / `stopSpinner()`**: Provides smooth loading animations during LLM processing and Git executions.
