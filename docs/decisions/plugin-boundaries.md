---
title: Plugin boundaries — decision history
type: decisions-log
capability: plugin-boundaries
---

# Plugin boundaries — decision history

**Read this before moving a skill, agent or shared file between plugins.**

How the marketplace's plugins (`code-review`, `sdlc`, a future `ds`) share work without
coupling. No separate grill transcript exists, so each decision carries its short why inline.
D1–D7 are summarized in [ADR 0001](../adr/0001-plugin-boundaries.md).

## Source keys

| Key | Record |
|---|---|
| **G1** | design discussion 2026-10-24 (handoff 02: code-review placement) |

## Decisions

| | Decision | Date | Status | Record |
|---|---|---|---|---|
| D1 | `code-review` stays a standalone plugin; consumers depend on it, never on its files | 10-24 | accepted | G1 |
| D2 | Small shared files have one source, synced into each plugin, CI fails on drift | 10-24 | accepted | G1 |
| D3 | Loose `~/.claude` skills are never a plugin dependency | 10-24 | accepted | G1 |
| D4 | Review is its own sdlc stage, swappable via `stages.review.skill` | 10-24 | accepted | G1 |
| D5 | Delete legacy loose `code-review` skill; callers name `code-review:review` explicitly | 10-24 | accepted | G1 |
| D6 | A shared file's source lives in the plugin that owns its contract; `scripts/shared-files.json` maps copies | 10-24 | accepted | G1 |
| D7 | Hard-coded refs split three ways: swappable ops → slots; reference files → vendored; stack conventions → `stacks.<stack>.skill` | 10-24 | accepted | G1 |
| D8 | Each plugin owns its own config file; no shared config that every plugin reads | 10-24 | accepted | G1 |

### D1 — code-review standalone, consumed by namespaced entry points

Consumers (`sdlc`, the future `ds` plugin) declare it in `plugin.json`:

```json
"dependencies": [{ "name": "code-review", "version": "^0.1" }]
```

They call only namespaced entry points — `code-review:review`, `code-review:*-reviewer` — and
never read its internal files.

- **Why:** installing a consumer installs and enables the dependency, so the install stays one
  unit. Namespaced names are a versioned contract (ranges resolve against
  `code-review--v<version>` tags). Internal paths are not: `ds-review/SKILL.md:70` already
  points at a stale `skills/code-review/references/` path (real: `skills/review/references/`).
- **Rejected:** merging into sdlc (ds-review and ad-hoc reviews would need all of sdlc);
  full duplication per plugin (eight reviewer agents drifting in two copies).
- **Sources:** <https://code.claude.com/docs/en/plugins/dependencies.md>;
  <https://code.claude.com/docs/en/plugins-reference> (component paths can't escape the plugin
  root, so plugins cannot share a common folder at runtime).

### D2 — shared files: one source, synced, drift-checked

Small files more than one plugin needs (review contract, severity scale) live once in the repo.
A sync script copies them into each plugin that uses them; CI fails if a copy differs from the
source. No hand-maintained duplicates.

- **Why:** each plugin stays self-contained at runtime (D1's containment limit) without two
  hand-edited copies of the same fact.

### D3 — no loose-skill dependencies

A plugin never depends on a skill living loose in `~/.claude`: nothing installs or versions it.
Pack it into a plugin (then D1 applies) or vendor it (then D2 applies).

- **Current violation:** `plugins/sdlc/README.md` § Prerequisites — `domain-modeling`,
  `atomic-commit`, `unit-test`, `story-create`, `angular-developer`, `react-developer`,
  `figma-to-code`, plus `doc-compressor`/`adr-writer` agents and doc-contracts.

### D4 — review is its own sdlc stage

`… → impel → review → ship`. Swappable through `.claude/workflow.json`
(`plugins/sdlc/contracts/workflow-config.md`):

```json
"stages": { "review": { "skill": "org-review" } }
```

Default `code-review:review` (installed via D1); `"none"` skips the stage. No thin wrapper
`review` skill per plugin — the config slot is the swap point.

sdlc owns a **review stage contract**, and any reviewer must conform to it:

- **Input:** a fixed point or a file set, plus spec sources.
- **Output:** findings ranked P0–P3 in one format, written to `state.json`.

- **Why:** `/impel`, `/ship`, the feedback loop (handoff 03) and the PR-thread handler
  (handoff 05) read one shape regardless of which reviewer ran; review → impel / review → grill
  become explicit stage transitions instead of logic hidden inside `/impel`.
- **Rejected:** keeping review as a step inside `/impel` (org reviewer only configurable inside
  impel; loop stays implicit).
- The stage contract is a D2 shared file; the future `ds` plugin gets the same
  `stages.review` slot and a synced copy.

### D5 — delete the legacy loose `code-review` skill

Delete `claude-code/skills/code-review/` (loaded every session through the `~/.claude/skills`
symlink). sdlc and `ds-review` call `code-review:review` explicitly, never bare `/code-review`.
The `cursor/skills/code-review/` mirror stays — Cursor has no plugins.

- **Why:** `/impel` (`SKILL.md:316`) and `/ship` call bare `/code-review`, which resolves to the
  legacy loose skill, not the plugin's `code-review:review` — the pipeline has not been running
  the maintained plugin. Resolves O1.

### D6 — shared-file source lives with its contract owner

A D2 shared file's single source lives in the plugin that owns its contract — e.g.
`plugins/sdlc/contracts/review-stage.md`, owned by sdlc. `scripts/shared-files.json` maps each
source to its copy paths; a sync script writes the copies; CI fails on drift.

- **Why:** ownership is visible from the path. A neutral `shared/` folder leaves no owner for
  changes.
- **Rejected:** a neutral `shared/` folder at the repo root. Resolves O3.

### D7 — what gets a config slot

Hard-coded references in plugins split into three kinds:

| Kind | Examples | Handling |
|---|---|---|
| (a) Swappable operations an org would replace | `atomic-commit`, review, tracker ops, possibly `doc-compressor`/`adr-writer` | config slot with a contract: `capabilities.<name>` in `workflow.json` for an operation used inside a stage (e.g. commit per impel step), alongside existing `stages.<stage>` for whole-stage swaps |
| (b) Reference files the plugin's own steps read | doc-contracts `jsdoc`/`decisions-log`/`story-doc`, `unit-test/references/test-first`, `testing/testing-principles` | vendored into the plugin via the D2/D6 sync — not slots |
| (c) Per-stack conventions | `angular-developer`, `react-developer` | `stacks.<stack>.skill` |

Plugin-internal agents (`tdd-planner`, the implementers) stay fixed.

- **Rule:** slot only what an org would actually replace. Every slot default must ship in an
  installable plugin (D3).
- **Why:** slotting contract files lets a repo break pipeline correctness and bloats config.
- **Rejected:** everything overridable.
- **Note:** `plugins/sdlc` still references stale `~/.claude/skills/impel/` — impel now lives
  in the plugin.

### D8 — one config file per plugin

Each plugin's own setup writes its config file, and its own contract defines the schema:

| File | Owner | Holds |
|---|---|---|
| `.claude/workflow.json` | sdlc | `stages`, `capabilities`, `stacks` |
| `.claude/design-system.json` | design-system | its stages and slots (written by `/ds-setup`) |
| `docs/agents/code-review.md` | code-review | its own config |

A config file holds wiring, never another plugin's settings: `stages.review.skill` names the
reviewer; the reviewer's own config stays in its own file.

A value several plugins need is read from the repo when possible (default branch from git),
otherwise owned by one plugin that the others call (commit format → `capabilities.commit`;
tracker → `docs/agents/*-tracker.md`). Per-user values go in the plugin's `userConfig`
(`plugin.json`), not in a repo file.

- **Why:** a shared file needs one schema owner that knows every plugin's keys, which
  re-couples them (D1); an uninstalled plugin leaves a dead section behind; plugins couldn't
  change their config shape independently.
- **Rejected:** one `workflow.json` with a section per plugin.
- **Cost:** no single file shows the whole setup. If needed, add a read-only command that
  prints every plugin's config, not a shared file.
- **Source:** <https://code.claude.com/docs/en/plugins-reference> (`userConfig`).

## Still open

- ~~**O1**~~ — resolved by D5.
- **O2** — fix `claude-code/skills/ds-review/SKILL.md:70` stale contract path (per D1: stop
  reading the path at all).
- ~~**O3**~~ — resolved by D6.
