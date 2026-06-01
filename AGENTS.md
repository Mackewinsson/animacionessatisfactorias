# AGENTS.md

This file orients AI coding agents working in this workspace (`/Users/PaleMac`).

## Workspace model

This directory is a **home-folder workspace**, not one application repository. Treat each codebase under `projects/` as its **own project** with its own git history, dependencies, and conventions. Prefer changing files only inside the project the user is working on unless they ask otherwise.

Do **not** search or edit Cursor-managed worktrees under `~/.cursor/worktrees` unless the user explicitly asks.

## Projects under `projects/`

| Path | Package / focus | Notes |
|------|-----------------|--------|
| `projects/agent-insight-hub` | Agent Insight Hub | React + AWS serverless monorepo. See **`projects/agent-insight-hub/AGENTS.md`** for stack, layout, and commands. |
| `projects/customer-gdpr-deletion` | GDPR deletion (related backend) | Companion/isolated service; read that repo's `README` and local docs when touching it. |
| `projects/data-distribution-order-api` | `data-distribution-order-api` | Turbo/npm workspaces, CDK + Lambdas (order distribution API). |
| `projects/dip-order-database-service` | `dip-order-database-service` | Turbo/npm workspaces, CDK + data/ETL style Lambdas. |
| `projects/oca-monitor-account-creation` | `monitor-account-creation` | Turbo workspaces, AWS-style layout similar to sibling OCA repos. |
| `projects/wallet-hub` | `wallet-hub` | Turbo/npm workspaces, CDK + application packages. |

When starting work, **open or `cd` into the target project** and follow that project's `README`, `AGENTS.md`, and `.cursor/rules/` if present.

## Default agent behavior

- **Run commands** from the relevant project root (e.g. `projects/agent-insight-hub`), not from the home directory, unless the task is explicitly workspace-wide.
- **Respect existing tooling**: most `projects/*` repos use **npm** workspaces, **Turbo**, **Prettier**, and **ESLint**; use each repo's `package.json` scripts.
- **Keep changes scoped** to the requested feature or fix; avoid drive-by refactors across unrelated projects.
- **Secrets**: never commit credentials; use existing env patterns (`.env`, CDK context, CI secrets) documented per repo.

## Cursor-specific

- Project-specific rules may live in `projects/<name>/.cursor/rules/` as `.mdc` files; they apply when matching files are open or when `alwaysApply` is set.
- If the user's question clearly targets one repo, prefer that artifact's local context over the generic workspace sections below the fold.
