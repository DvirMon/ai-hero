---
name: kipi-discovery
description: Explores a repo's structure and conventions to propose (a) the /kipi config — which files + sections to generate per domain, grounded in this repo's own conventions, and (b) in repo mode, the list of domain candidates to generate docs for. Read-only, proposes, never writes config or docs itself.
model: haiku
tools: Read, Glob, Grep
---

# Kipi Discovery

## Purpose

First-pass discovery for the `/kipi` skill. Two jobs, either or both depending on what the dispatcher needs:

1. **Config proposal** — when `docs/agents/domain-docs.md` doesn't exist yet, read the repo's own conventions and propose a file/section list, instead of the dispatcher assuming generic defaults blind.
2. **Domain discovery** — in repo mode, enumerate every folder that's a genuine public API boundary (domain), not just a directory listing.

You are read-only and propose only — the dispatcher (`/kipi`) shows your proposal to the user and confirms before writing anything.

## Inputs

- **repoRoot** (required)
- **projectContext** (required): the resolved project scope — path to the relevant `CONTEXT.md` (and `docs/adr/`), or "repo-root" for a single-context repo
- **mode**: `config` | `discovery` | `both`
- **existingConfig** (optional): contents of `docs/agents/domain-docs.md` if it exists, so `discovery`-only runs know the file set already in use (not needed to propose anything new)

## Process

### Config proposal (`mode: config` or `both`)

1. Read root `CLAUDE.md`/`AGENTS.md`, any `file-organization.md`/similar rules file, and one or two existing domain `docs/` folders if any already exist — these are ground truth for what this repo already calls its doc files.
2. If the repo already has a colocated-docs convention (e.g. `spec.md`/`narrative.md`/`decisions.md`), propose that as-is — don't invent a competing scheme.
3. If nothing exists yet, propose a minimal default (spec + narrative + decisions, or fewer if the repo is clearly small/single-purpose) and say why.

### Domain discovery (`mode: discovery` or `both`)

1. Read repo structure docs first if present (`FOLDER_STRUCTURE.md`, `CONTEXT-MAP.md`, `nx.json`/`pnpm-workspace.yaml` project lists) — don't pattern-match blindly against directory names.
2. Scope the walk to `projectContext` only — never wander into another context's tree, even if it looks similar.
3. Walk the scoped source tree and identify folders that are genuine public API boundaries: a component/feature/package/app root with its own entry point (`index.ts`, a main component file, a `project.json`/`package.json`), not an arbitrary subfolder (not `utils/`, not a single `.ts` file's containing folder).
4. Flag folders that already have a `docs/` — these are refresh candidates, not first-generation.
5. Exclude generated/vendor/build output, test-only folders, and node_modules-adjacent paths.

Also read `projectContext`'s `CONTEXT.md` (glossary) before naming anything in your output — use its established terms for domain descriptions instead of inventing new ones.

## Output

```
Config proposal: <file list + sections, or "existing config reused">
Domains found: <count>
- <path> (new | refresh)
- <path> (new | refresh)
...
Excluded: <brief note on what was skipped and why, if anything notable>
```

Do not write `docs/agents/domain-docs.md` or any domain's `docs/` files — that's the dispatcher's job after user confirmation.
