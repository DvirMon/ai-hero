---
title: Plugin boundaries — decision history
type: decisions-log
capability: plugin-boundaries
---

# Plugin boundaries — decision history

**Read this before moving a skill, agent or shared file between plugins.**

How the marketplace's plugins (`code-review`, `sdlc`, a future `ds`) share work without
coupling. No separate grill transcript exists, so each decision carries its short why inline.
D1–D7 and D9–D13 are summarized in [ADR 0001](../adr/0001-plugin-boundaries.md).

## Source keys

| Key | Record |
|---|---|
| **G1** | design discussion 2026-10-24 (handoff 02: code-review placement) |
| **G2** | grill 2026-10-24 (handoff 04: per-repo commit format) |
| **G3** | story plugin plan + grill 2026-10-24 |

## Decisions

| | Decision | Date | Status | Record |
|---|---|---|---|---|
| D1 | `code-review` stays a standalone plugin; consumers depend on it, never on its files | 10-24 | accepted | G1 |
| D2 | Small shared files have one source, synced into each plugin, CI fails on drift | 10-24 | accepted | G1 |
| D3 | Loose `~/.claude` skills are never a plugin dependency | 10-24 | accepted | G1 |
| D4 | Review is its own sdlc stage, swappable via `stages.review.skill` | 10-24 | revised by D9 | G1 |
| D5 | Delete legacy loose `code-review` skill; callers name `code-review:review` explicitly | 10-24 | accepted | G1 |
| D6 | A shared file's source lives in the plugin that owns its contract; `scripts/shared-files.json` maps copies | 10-24 | accepted | G1 |
| D7 | Hard-coded refs split three ways: swappable ops → slots; reference files → vendored; conventions → `projects.<name>.skills.<type>` | 10-24 | accepted, amended 10-24 | G1 |
| D8 | Each plugin owns its own config file; no shared config that every plugin reads | 10-24 | accepted | G1 |
| D9 | sdlc has a real `/review` stage skill; the reviewer is a separate `stages.review.reviewer` slot | 10-24 | accepted | G1 |
| D10 | A capability slot may have no default; unset means the stage's built-in behavior | 10-24 | accepted | G2 |
| D11 | Story skills/agents become the `story` plugin: generic stages, own `.claude/story.json`, stack skills shipped in-plugin | 10-24 | accepted | G3 |
| D12 | sdlc routes a step type to an executor named by `projects.<p>.executors.<type>`, default `sdlc:implementer` | 10-24 | accepted | G3 |
| D13 | design-system depends on `story` for Storybook; `ds-storybook-scaffolder` is deleted | 10-24 | accepted | G3 |

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
  `story-create` is resolved by D11 (packed into the `story` plugin).

### D4 — review is its own sdlc stage

`… → implementation → review → ship`. Swappable through `.claude/workflow.json`
(`plugins/sdlc/contracts/workflow-config.md`):

```json
"stages": { "review": { "skill": "org-review" } }
```

Default `code-review:review` (installed via D1); `"none"` skips the stage. No thin wrapper
`review` skill per plugin — the config slot is the swap point.

sdlc owns a **review stage contract**, and any reviewer must conform to it:

- **Input:** a fixed point or a file set, plus spec sources.
- **Output:** findings ranked P0–P3 in one format, written to `state.json`.

- **Why:** `/implementation`, `/ship`, the feedback loop (handoff 03) and the PR-thread handler
  (handoff 05) read one shape regardless of which reviewer ran; review → implementation / review → grill
  become explicit stage transitions instead of logic hidden inside `/implementation`.
- **Rejected:** keeping review as a step inside `/implementation` (org reviewer only configurable inside
  implementation; loop stays implicit).
- The stage contract is a D2 shared file; the future `ds` plugin gets the same
  `stages.review` slot and a synced copy.

### D5 — delete the legacy loose `code-review` skill

Delete `claude-code/skills/code-review/` (loaded every session through the `~/.claude/skills`
symlink). sdlc and `ds-review` call `code-review:review` explicitly, never bare `/code-review`.
The `cursor/skills/code-review/` mirror stays — Cursor has no plugins.

- **Why:** `/implementation` (`SKILL.md:316`) and `/ship` call bare `/code-review`, which resolves to the
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
| (a) Swappable operations an org would replace | `atomic-commit`, review, tracker ops, possibly `doc-compressor`/`adr-writer` | config slot with a contract: `capabilities.<name>` in `workflow.json` for an operation used inside a stage (e.g. commit per implementation step), alongside existing `stages.<stage>` for whole-stage swaps |
| (b) Reference files the plugin's own steps read | doc-contracts `jsdoc`/`decisions-log`/`story-doc`, `unit-test/references/test-first`, `testing/testing-principles` | vendored into the plugin via the D2/D6 sync — not slots |
| (c) Per-project conventions | `angular-developer`, `react-developer`, `nodejs-developer` | `projects.<name>.skills.<type>`, matched per step by path |

Executor agents are generic (`implementer`, `test-implementer`) and load the skills the step's project names; `tdd-planner` stays fixed.

- **Amended 10-24:** `stacks.<stack>` and per-stack implementer agents replaced by `projects` — one ticket can span a server, a frontend and a library in one monorepo, and `projectKind` was repo-wide.

- **Rule:** slot only what an org would actually replace. Every slot default must ship in an
  installable plugin (D3) — or the slot has no default at all (D10).
- **Why:** slotting contract files lets a repo break pipeline correctness and bloats config.
- **Rejected:** everything overridable.
- **Note:** `plugins/sdlc` still references stale `~/.claude/skills/impel/` — implementation now lives
  in the plugin.

### D8 — one config file per plugin

Each plugin's own setup writes its config file, and its own contract defines the schema:

| File | Owner | Holds |
|---|---|---|
| `.claude/workflow.json` | sdlc | `stages`, `capabilities`, `stacks` |
| `.claude/design-system.json` | design-system | its stages and slots (written by `/ds-setup`) |
| `.claude/story.json` | story | per-project stack skills, paths, discovery sources (D11) |
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

### D9 — the review stage skill and the reviewer slot

Revises D4. sdlc ships a `/review` stage skill (`plugins/sdlc/skills/review/`). It resolves
the reviewer from `stages.review.reviewer` (default `code-review:review`), runs it, commits its
fixes as `[#N review]` commits, writes `review.md` beside `progress.md`, and names the next
stage. The reviewer only meets `plugins/sdlc/contracts/review-stage.md`.

- **Why:** if the reviewer *were* the stage, it would have to read and write `state.json` and
  decide what runs next — code-review would depend on sdlc's internals (D1). D4's "no wrapper"
  holds for the reviewer itself: it needs no sdlc adapter.
- **Record:** `review.md`, not `state.json` — the review belongs to one unit's branch, like
  `progress.md`, and must exist without a workspace; the schema admits no field without a
  consumer.
- **Rejected:** the reviewer fills `stages.review.skill` directly and writes `state.json`
  itself (couples every reviewer to sdlc's state format).
- **Scope:** routing names the next stage only. Sending work back automatically is handoff 03.

### D10 — a capability slot may have no default

`capabilities.<name>` may ship with no default. Unset, the stage does the operation itself,
plainly; set, it hands the operation to the named skill. First case: `capabilities.commit` —
unset, stages write a plain conventional commit with the tracker's `Refs:` trailer; set, they
hand the commit to e.g. `atomic-commit`, which owns the format.

```json
"capabilities": { "commit": { "skill": "atomic-commit" } }
```

- **Why:** some operations are a repo or user tool, not a pipeline concern. `atomic-commit`
  is a loose skill shared across repos, mostly commit philosophy plus a format; packing it
  into a plugin only to satisfy D7's default rule is cost without payoff. With no default,
  sdlc never depends on a loose skill — the repo opts in by naming one — so D3 holds.
- **Rejected:** `atomic-commit` as its own plugin (a format toggle doesn't justify a
  plugin); moving it into sdlc (couples a repo tool to the pipeline).
- **Construction error:** a slot naming a skill that isn't installed stops the stage and
  names both.

### D11 — the `story` plugin

`prd-discovery` (skill + agent), `story-plan` and `story-create` become one `story` plugin
with generic stages: `story:setup`, `story:discovery`, `story:plan`, `story:create`, the
`story:implementer` agent, `story:docs`. Stack, paths and discovery sources live in its own
`.claude/story.json` (D8), `projects` matched by path glob like `workflow.json`.

- **Stack skills (D7c):** `story:stack-angular` and `story:stack-react` ship in the plugin
  as installable defaults (D7 rule); `projects.<p>.skills.create` / `.implement` name them.
  A Vue repo names its own. Project content (e.g. a reference implementation path) moves to
  that project's conventions doc.
- **Create ≠ implement:** `story:create` designs one story (file set, controls, mocks, host
  shape) and emits a story spec; `story:implementer` writes the code from that spec with
  `skills.implement`. The story spec is the contract between them.
- **Discovery absorbs `prd-discovery`:** `story:discovery` = community pain + peer
  capabilities + internal coverage → PRD. Its peer-capability inventory is a required input
  to `story:plan`.
- **Shared contracts (D2/D6):** `story-doc.md` becomes story-owned, synced copy into sdlc;
  `prd.md` stays sdlc-owned, synced copy into story.
- **`sources.packages` ≠ `sources.primitives`:** story.json `sources.packages` = peer
  libraries discovery compares against; design-system.json `sources.primitives` = libraries
  a DS builds on. Different facts, so neither duplicates the other and story never reads
  `design-system.json`.
- `story` does not depend on `sdlc`; it runs standalone.
- **Why:** the skills were hard-coded to one repo (host-file glob, conventions-doc path,
  competitor set, Angular/React references) and loose (D3). Splitting create from implement
  lets sdlc and design-system reuse the same writer.
- **Rejected:** stack in `workflow.json` (D8 — another plugin's settings); one create stage
  that also writes code; keeping `prd-discovery` a separate skill beside `story:discovery`.

### D12 — sdlc executor slot per step type

`/implementation` § Route reads `projects.<p>.executors.<type>` from `workflow.json`;
unset, the step goes to `sdlc:implementer`. Story repos set
`"executors": { "story": "story:implementer" }`; the stack is read from `story.json`, never
repeated in `workflow.json`. `docs.prdWriter` repoints to `story:discovery`.

- **Why:** sdlc names the executor by config, so it never depends on `story` (D1/D3) and any
  plugin can supply an executor for a step type.
- **Rejected:** sdlc declaring a `story` dependency; keeping the story branch inside
  `sdlc:implementer`.

### D13 — design-system depends on `story`

`design-system/plugin.json` declares `story`. `ds-scaffold` Phase 5 Storybook calls
`story:create` → `story:implementer`. `ds-storybook-scaffolder` is deleted;
`design-system.json` `sources.storybook` / `stacks.storybook.skill` move to the DS project's
`story.json` entry, written by `ds-setup` via `story:setup`.

- **Why:** one story writer instead of two drifting ones (D1 consumption pattern).
- **Rejected:** keeping `ds-storybook-scaffolder` beside `story` (duplicate conventions).

## Still open

- ~~**O1**~~ — resolved by D5.
- **O2** — fix `claude-code/skills/ds-review/SKILL.md:70` stale contract path (per D1: stop
  reading the path at all).
- ~~**O3**~~ — resolved by D6.
