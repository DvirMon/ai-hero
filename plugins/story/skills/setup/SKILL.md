---
name: setup
description: "Configure a repo for the story plugin — read its projects, Storybook setup, existing stories and docs, then write `.claude/story.json` per contracts/story-config.md, asking only what the repo can't answer. Run once per repo; /story:discovery, /story:plan, /story:create and /story:docs run it when the config is missing, and design-system's /ds-setup calls it for a DS project. Also refreshes an existing config when projects or stacks changed."
---

# Story setup

Write `.claude/story.json` from what the repo actually does. Contract:
`${CLAUDE_PLUGIN_ROOT}/contracts/story-config.md` — it wins where this skill is silent.

## 1. Read the repo

Read before asking. One pass, no builds, no installs, no Storybook.

| Find | Where |
|---|---|
| Projects | `nx.json` / `project.json`, `angular.json`, workspace `package.json` globs, `pnpm-workspace.yaml` |
| Stack per project | dependencies: `@angular/core`, `react`, `vue`, `svelte`, … |
| Storybook | `.storybook/` per project, `@storybook/*` dependencies |
| Existing stories | `**/*.stories.*`; for each project, the folder pattern and the host file pattern (`*-story-host.component.ts`, `*.stories.tsx`) → `paths.stories`, `paths.host` |
| Domain folders | the nearest `docs/` above existing stories → `domainDir` |
| Conventions doc | a doc describing story layout (`grep -ril "story-host\|\.stories\." **/docs`) → `docs.conventions` |
| PRDs | `**/docs/prd.md` → `paths.prd` when it differs from the default |
| Typecheck | `typecheck` target or script per project |
| Installed skills | the stack skills that fit each project (`story:stack-angular`, `story:stack-react`, `*-developer`) |

## 2. Propose

One entry per project that has Storybook or is meant to. Fill each key from §1; write only keys
that differ from the contract's defaults.

- **`skills.create`** — the stack skill for the project's framework. No bundled skill fits (Vue,
  Svelte) → name an installed one, or leave it empty and say discovery/creation will run on the
  core only.
- **`skills.implement`** — the framework's developer skill plus the stack skill.
- **`skills.docs`** — the stack skill.
- **`sources`** — propose `anchors` from the section titles of the anchors file that match the
  project's domain (a table library → `data-grid / table`). `packages` are **peers to compare
  against**, not what the project is built on: never copy a design system's primitives from
  `design-system.json`. Unsure → leave `sources` empty; discovery runs open and proposes them.
- A single-project repo gets `"path": "**"`. List more specific paths first.

Show the whole draft once — one table per project plus the JSON — and let the user edit rows.
Don't ask key by key.

## 3. Write

- `.claude/story.json` with `version: 1`.
- Add `.claude/story.local.json` to `.gitignore`.
- An existing file: show the diff, keep keys the user set by hand, never drop a project silently.

## 4. Report

The file written, one line per project (path, stack skill, sources count), and what is still
open: a missing conventions doc (`/story:docs` writes one), empty sources, a stack with no skill.

## Called by another plugin

`/ds-setup` calls this for a design-system project. It passes the DS root and framework; skip
§1's project scan for that root and propose one entry for it. The DS's Storybook folder and
exemplars become `paths.stories` and `docs.conventions`.

The caller may also pass **pre-filled values** — keys it migrated from its own legacy config
(`paths.stories`, `docs.conventions`, `sources.internal`, `skills.create`, `skills.implement`).
Treat them as answers already given: put them in the draft as-is, marked as migrated, and
don't ask about them again.
