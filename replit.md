# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Packages

### `packages/repoforge` — RepoForge CLI

AI-powered CLI tool that translates natural language commands into GitHub operations.

**Run with:** `node packages/repoforge/bin/repoforge.js`

**Install globally:** `npm install -g repoforge` or `cd packages/repoforge && npm link`

**Architecture:**
- `bin/repoforge.js` — Entry point
- `src/index.js` — Main entry, flag parsing, mode dispatch
- `src/cli/flags.js` — CLI flag parser (minimist)
- `src/cli/renderer.js` — Terminal output, colors (chalk), banner
- `src/cli/repl.js` — Interactive REPL + NL processing pipeline
- `src/llm/client.js` — LM Studio API client
- `src/llm/prompt.js` — System prompt + message builder
- `src/llm/parser.js` — JSON intent parser + validation
- `src/github/webhooks.js` — n8n webhook dispatch + result formatting
- `src/config/loader.js` — Config read/write (`~/.repoforge/config.json`)
- `src/config/init.js` — Interactive setup wizard
- `src/history/logger.js` — Command history (`~/.repoforge/history.json`)

**Dependencies:** chalk, inquirer, minimist, ora, uuid, ws
