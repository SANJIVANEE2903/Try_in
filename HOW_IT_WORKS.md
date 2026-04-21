# 🔧 RepoForge — How It Works (Live Demo Results)

> **Machine:** Windows 11 | **Node.js:** v22.19.0 | **Date:** April 22, 2026  
> **LLM Model:** meta-llama-3.1-8b-instruct (via LM Studio + ngrok)  
> **Execution Engine:** n8n Cloud (chaitanya55.app.n8n.cloud)

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER TERMINAL                            │
│  > repoforge "create a private repo called demo-final"          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLI LAYER (Node.js)                           │
│  bin/repoforge.js → src/index.js → src/cli/repl.js              │
│  • Parses flags (--debug, --no-confirm, --dry-run)              │
│  • Validates input (non-empty, < 500 chars)                     │
│  • Manages session context (repo, branch)                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GRAPHIFY LAYER (Optional)                        │
│  src/graphify/context.js                                        │
│  • Queries knowledge graph (graphify-out/graph.json)            │
│  • Prepends codebase context to LLM prompt                      │
│  • Fails silently if binary not available                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM LAYER (Local AI)                          │
│  src/llm/client.js + src/llm/prompt.js                          │
│  • Sends system prompt + user input to LM Studio                │
│  • Receives structured JSON: { action, params, confidence }     │
│  • Validates against 12 known actions                           │
│  Endpoint: https://zit-anvil-clatter.ngrok-free.dev/v1          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXECUTION LAYER (n8n Cloud)                     │
│  src/github/webhooks.js                                         │
│  • POST to n8n webhook with action + params                     │
│  • n8n workflow calls GitHub API                                │
│  • Returns result (repo URL, PR number, repo list, etc.)        │
│  Webhook: https://chaitanya55.app.n8n.cloud/webhook/repoforge   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GITHUB API                                  │
│  • Creates repositories                                         │
│  • Lists repos, PRs                                             │
│  • Creates/merges pull requests                                 │
│  • Manages branches                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Live Test Results (Actual Output From My Machine)

### Test 1: Create Repository ✅

**Command:**
```
> repoforge "create a private repo called demo-final"
```

**LLM Response:**
```json
{
  "action": "create_repo",
  "params": {
    "repo": "demo-final",
    "visibility": "private"
  },
  "confidence": 1.0,
  "clarification_needed": false
}
```

**n8n Response:** HTTP 200
```json
{
  "success": true,
  "action": "create_repo",
  "result": {
    "name": "demo-final",
    "url": "https://github.com/chaitanyakhandagale15-rgb/demo-final",
    "private": true
  }
}
```

**Result:** ✅ Repository created at https://github.com/chaitanyakhandagale15-rgb/demo-final

---

### Test 2: List Repositories ✅

**Command:**
```
> repoforge "list my repositories"
```

**LLM Response:**
```json
{
  "action": "list_repos",
  "params": { "repo": null },
  "confidence": 1.0,
  "clarification_needed": false
}
```

**n8n Response:** HTTP 200 — returned 23 repositories including:

| Repository | Visibility |
|-----------|-----------|
| All_API_CODE | public |
| carepulse-connect | private |
| demo-final | private |
| FSWD_Project | private |
| Main_MERN_REPO | public |
| Mega_Project | private |
| My_Portfolio_Main | private |
| RepoForge | private |
| repoforge_new | private |
| SafeRoute | private |
| Second_Brain | private |
| ... and 12 more | |

---

### Test 3: Create Pull Request ⚠️

**Command:**
```
> repoforge "create a pull request from dev to main with title test pr"
```

**LLM Response:**
```json
{
  "action": "create_pr",
  "params": {
    "title": "test pr",
    "base": "main",
    "head": "dev",
    "repo": null
  },
  "confidence": 0.9,
  "clarification_needed": false
}
```

**n8n Response:** HTTP 200, `success: false`  
**Reason:** Repo name was not specified in the command — LLM set `repo: null`.  
**Fix:** Specify repo: `"create a PR on repoforge_new from dev to main with title test pr"`

---

## 📁 File Structure

```
repoforge_new/
├── packages/
│   └── repoforge/
│       ├── bin/repoforge.js          ← Entry point
│       └── src/
│           ├── index.js              ← Flag parsing, mode dispatch
│           ├── cli/
│           │   ├── repl.js           ← REPL loop + processNaturalLanguage()
│           │   ├── flags.js          ← CLI flag parsing (minimist)
│           │   └── renderer.js       ← Terminal UI (banner, spinners, colors)
│           ├── llm/
│           │   ├── client.js         ← LLM API call (fetch → LM Studio)
│           │   ├── prompt.js         ← System prompt + message builder
│           │   └── parser.js         ← JSON extraction + action validation
│           ├── graphify/
│           │   └── context.js        ← Graph context injection
│           ├── github/
│           │   └── webhooks.js       ← n8n webhook dispatch + result formatting
│           ├── config/
│           │   ├── loader.js         ← Config load/save/merge
│           │   └── init.js           ← Interactive setup wizard
│           └── history/
│               └── logger.js         ← Command history persistence
├── graphify-out/
│   ├── graph.json                    ← Knowledge graph (164 KB)
│   └── GRAPH_REPORT.md              ← Graph analysis report
└── package.json                      ← pnpm monorepo root
```

---

## ⚙️ Configuration

Config file: `~/.repoforge/config.json`

```json
{
  "github": {
    "token": "ghp_••••••••",
    "username": "chaitanyakhandagale15-rgb"
  },
  "llm": {
    "provider": "lmstudio",
    "endpoint": "https://zit-anvil-clatter.ngrok-free.dev/v1",
    "model": "meta-llama-3.1-8b-instruct",
    "temperature": 0.2
  },
  "n8n": {
    "webhook_base_url": "https://chaitanya55.app.n8n.cloud/webhook"
  },
  "graphify": {
    "enabled": true,
    "graph_path": "graphify-out/graph.json"
  }
}
```

---

## 🔄 Execution Flow (Step-by-Step)

When a user types `"create a private repo called demo-final"`:

| Step | Module | What Happens |
|------|--------|-------------|
| 1 | `repl.js` | Validates input (non-empty, < 500 chars) |
| 2 | `context.js` | Tries Graphify context enrichment (graceful fallback if unavailable) |
| 3 | `context.js` | Builds enhanced prompt: raw input + graph context |
| 4 | `client.js` | POST to LM Studio endpoint → `/v1/chat/completions` |
| 5 | `parser.js` | Extracts JSON from LLM response, validates action |
| 6 | `repl.js` | Checks confidence ≥ 0.5, shows action preview |
| 7 | `repl.js` | Prompts confirmation: "Proceed? (y/n)" |
| 8 | `webhooks.js` | POST to n8n: `{ action: "create_repo", params: {...} }` |
| 9 | n8n workflow | Calls GitHub API → creates repository |
| 10 | `webhooks.js` | Formats and displays result |
| 11 | `logger.js` | Saves to command history |

---

## 🎯 Supported Actions

| Action | Example Command |
|--------|----------------|
| `create_repo` | "create a private repo called my-app" |
| `list_repos` | "list my repositories" |
| `create_pr` | "create a PR on my-app from dev to main" |
| `list_prs` | "show open PRs on my-app" |
| `merge_pr` | "merge PR #5 on my-app" |
| `close_pr` | "close PR #3 on my-app" |
| `commit` | "commit with message 'initial setup'" |
| `push` | "push to main branch" |
| `pull` | "pull latest from main" |
| `clone_repo` | "clone my-app repository" |
| `delete_branch` | "delete branch feature/old" |
| `get_status` | "show status of my-app" |

---

## 🛡️ Key Design Decisions

1. **Privacy-First:** LLM runs locally via LM Studio — no data leaves your machine for AI inference
2. **Natural Language:** No memorizing CLI flags — just describe what you want in English
3. **Confidence Guard:** Refuses to act if LLM confidence < 50%
4. **Confirmation Step:** Always asks before executing destructive actions
5. **Modular Execution:** n8n handles all GitHub API calls — workflows can be updated without touching CLI code
6. **Graph-Enhanced Context:** Optional Graphify integration enriches LLM prompts with codebase knowledge

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd packages/repoforge && npm install

# 2. Run setup wizard (sets token, endpoints)
node bin/repoforge.js init

# 3. Use it!
node bin/repoforge.js "list my repos"
node bin/repoforge.js "create a private repo called my-new-project"
node bin/repoforge.js "create a PR on my-repo from dev to main with title 'feature update'"

# 4. Interactive REPL mode
node bin/repoforge.js
# > /repo my-app          (set active repo)
# > list open PRs         (natural language)
# > /history              (see past commands)
```

---

*Generated from live test results on April 22, 2026*
