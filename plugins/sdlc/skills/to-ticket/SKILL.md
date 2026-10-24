---
name: to-ticket
description: Pipeline entry — take an intake ticket ref (or a freeform ask, captured first via /to-intake), fetch it, write the PRD when its project says so, and initialize the ticket workspace and branch the rest of the pipeline reads from.
disable-model-invocation: true
---

# To Ticket

The pipeline entry. Takes a **ticket** — a rough, product-level description of what's wanted, not an engineering-detailed spec — and opens the workspace and branch every later stage reads. Two entry paths, one result:

- **Ref** (`/to-ticket PROJ-123`) — the item already exists; fetch it.
- **Idea** (no ref) — draft the ticket, capture it with `/to-intake`, then continue with the ref it returns.

Both end with a v5 `state.json` and a branch.

## Process

### 0. Resolve the workflow config

Read the merged config per `${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md` § Reading it. **No
`.claude/workflow.json`, or no `docs/agents/ticket-tracker.md`** → run `/setup-skills` first,
then continue here — the first ticket must not fail on missing config. Every tracker call
below goes through the repo's `docs/agents/ticket-tracker.md` (contract
`${CLAUDE_PLUGIN_ROOT}/contracts/tracker.md`); this skill never branches on a tracker name.

Load the repo-level `stages.to-ticket.skills` now, per `${CLAUDE_PLUGIN_ROOT}/contracts/stage-skills.md`; the
ticket's project list follows once step 4 has resolved `<domain-path>`.

### 1. Gather context

**Ref path:** skip to step 3 — the ticket already says what's wanted. Still settle the
domain (step 4).

**Idea path:** work from whatever the user has already described. Ask only enough to make the ticket useful — a title and a paragraph of intent, not a full requirements gathering (that's `/grill-with-docs`'s job, next). Do not interview.

### 2. Draft the ticket (idea path only)

Pick a template by ticket type. If the ask is clearly too large for one ticket, split it into multiple sibling tickets rather than forcing one oversized ticket — use judgement, not a hard size rule.

**Bug/maintenance/small ask** — use `<ticket-template>` (default, most tickets):

<ticket-template>

## Summary

One or two sentences, from the product's perspective — the ask, not the implementation.

## Context

Why this matters now. Link to whatever prompted it, if anything did.

## Rough scope

A loose bullet list of what's in scope — not a spec, just enough for someone to recognize the shape of the work.

## Other relevant data

Links to related docs, prior PRs, or issues — only when relevant. Omit if none.

</ticket-template>

**Feature** — new user-facing capability, multi-step work, or anything `/grill-with-docs` would otherwise have to ask basic scoping questions about. Use `<feature-ticket-template>`:

<feature-ticket-template>

## Summary

One or two sentences, from the product's perspective — the ask, not the implementation.

## Context

Why this matters now. Link to whatever prompted it, if anything did.

## Goal

What the user/system does once this ships. Outcome, not implementation.

## How to reach it in the UI

Step-by-step path to the feature in the product, if it has a UI surface. Omit this section for backend-only or headless work.

## Feature flags

Which flags gate this, and which environments they're enabled in. Omit if the feature ships unflagged.

## Rough scope

A loose bullet list of what's in scope — not a spec, just enough for someone to recognize the shape of the work.

## Acceptance criteria / how to know it's done

Explicit, testable criteria — this is the ticket's definition of done, and what `/grill-with-docs` and `/to-spec` refine into concrete test cases.

## Other relevant data

Links to designs (Figma frame URLs — one per row when possible), prior PRs, recordings, related
tickets, or existing test examples.

</feature-ticket-template>

Omit a section entirely rather than leaving it filled with a placeholder — a missing "How to reach it in the UI" is a signal this is backend work, not a gap to fill with N/A.

**`docs.prdWriter: to-ticket`** (the ticket's project, per `workflow-config.md` § Projects) —
the full draft becomes the feature-variant `prd.md` (step 4), and the ticket body is a short summary: the `## Summary` section plus a link to the PRD path. The
tracker holds the pointer; the PRD holds the requirements.

### 3. Get the ticket

**Idea path:** run `/to-intake` with the drafted title and body (the summary body, when this skill writes the PRD).
It creates the item — and its epic, per `intake.epic` — and returns the ref. Continue with
that ref; don't create the item yourself.

**Both paths:** fetch the item through `docs/agents/ticket-tracker.md` `## Fetch` — title,
description, acceptance criteria, URL. Never edit the item's description; product owns it
(`${CLAUDE_PLUGIN_ROOT}/contracts/tracker.md`).

### 4. Initialize the ticket workspace

Every effort in this pipeline has a workspace directory, where `<slug>` is a short kebab-case name derived from the ticket title. The workspace root is always `<domain-path>/docs/work/<slug>/` — domain-colocated. There is no repo-root default; `<domain-path>` must be resolved first.

**Resolving `<domain-path>`** — never guess silently:

1. If the user already named the domain path (in this conversation, or as an argument), use it.
2. Otherwise, try to derive it from the ticket's subject: does the ask map cleanly to one workspace project (`apps/<name>/`, `packages/<name>/`, `libs/<name>/`)? If `ticketRef` itself resolves to a path under one of those (e.g. a backlog row like `apps/<name>/BACKLOG.md#T-03`), that's a strong signal.
   The domain path must fall inside a project from the workflow config — that project's
   `docs.*` and `stages` apply to the ticket. No project matches → stop, name the path.
3. If a derivation was made in step 2, **confirm it with the user** before writing anything — state the derived path and ask them to confirm or correct it. Do not proceed on an unconfirmed guess.
4. If neither 1 nor 2 resolves cleanly, ask the user directly for the domain path.

**Start the branch before writing anything.** Work never happens on the default branch. Which
branch follows `prUnit` (`${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md`):

| `prUnit` | Branch | `units[]` |
|---|---|---|
| `sub-issue` | `docs/<slug>` — the planning branch. The whole epic's planning docs (`/to-ticket` → `/to-issues`) ship as one PR from it; each sub-issue later gets its own branch off `main` | `[]` — `/to-issues` appends one unit per sub-issue |
| `ticket` | `<type>/<ticket-key>-<slug>` (key lower-cased, `<type>` per start-branch § Naming) — planning docs and code ship on it as one PR; Jira sub-tasks are steps on it | one unit: `remoteRef` = `ticketRef`, `branch`, `worktree`, `pr: null`, `readiness: null`, `assessed: null` |

Run `${CLAUDE_PLUGIN_ROOT}/skills/to-tasks/references/start-branch.md` with that branch and the config's `isolation` once
`<domain-path>` and `<slug>` are settled — it prunes merged work, refuses a dirty tree, and
creates the branch off `origin/main`: in its own worktree (entered) for `worktree`, in place
for `branch` (`worktree: null`). Every path below then resolves inside it. On resume (the
existing-workspace case below), switch to the recorded branch/worktree instead of creating a
new one; if its planning PR already merged, the workspace is on `main` and resuming it means a
new `docs/<slug>-<topic>` branch from the same procedure.

This skill creates the workspace; every later stage (`/grill-with-docs`, `/to-spec`, `/to-issues`, `/to-tasks`) reads and extends it purely via the paths recorded in `state.json` below — they read `workspaceRoot`/`decisionsPath`/`prdPath`/`capabilityLogPath`/`specPath`/`architecturePath` rather than reconstructing or assuming a root themselves. This is documented here, once.

The full field-by-field schema (owner, consumer, and the validation routine every state-reading
skill follows) lives in `references/state-schema.md` — this section only shows the shape being
written.

This skill records the ticket's reference and URL in `state.json` — it does **not** write a local snapshot of the ticket body to the workspace. The ticket itself lives in the tracker `docs/agents/ticket-tracker.md` names; `ticketRef`/`ticketUrl` are the pointer back to it. The one copy it makes is the acceptance criteria, into `prd.md` (below), each tagged with its source.

**Before writing anything**, check whether `<workspace-root>` already exists. If it does, stop —
do not write the workspace or `state.json`. Tell the user the directory already exists and ask
whether to resume the existing workspace (read its `state.json` and continue the pipeline from
there) or pick a different slug for a new workspace. Never silently overwrite an existing
`state.json` — a re-run of `/to-ticket` on the same slug must not clobber another session's
`decisionsPath`/`specPath`/`architecturePath`/`units` progress.

Once the check passes, dispatch the writes to a writer per `references/file-writes.md` —
never inline. `haiku` when the brief holds the full JSON below and the full `prd.md` text,
filled in; `sonnet` if the writer must fit the PRD into an existing file. Join it before step
5's commit, which needs the files on disk.

**PRD.** Resolve `prdPath` from the ticket's project `docs.prd` (`{domainDir}` =
`<domain-path>`), per `workflow-config.md` § Projects.

- **`docs.prdWriter: to-ticket`** — write the feature variant of `${CLAUDE_PLUGIN_ROOT}/contracts/prd.md` at `prdPath`:
  shared core (Problem / Who / User stories / Out of scope) plus Current flow / Target flow /
  Success signal, from the step-2 draft or the fetched ticket.
- **Acceptance criteria** — copy each remote AC from the fetch into `prd.md`, tagged
  `[<ticketRef> · MM-DD]` (today's pull date). `/to-spec` re-fetches and flags changes
  against these. On the idea path, ACs drafted in step 2 that live only in the PRD (the
  ticket holds the summary) have no remote source and take no tag.
- **`docs.prdWriter: <skill>`** — that skill owns the PRD (e.g. `story:discovery`); don't write
  it. Set `prdPath` to the resolved path when that file exists, else `null`. The remote ACs
  stay on the ticket and are not copied — `/to-spec` reads them from the tracker.

**Wired skills** that hook § 4 run here, before the writer finishes `state.json` — e.g.
`figma:capture` saves frame screenshots under `<workspace-root>/figma/` and fills `figma[]`.

Write `<workspace-root>/state.json` (substituting whichever root was decided above), per
`references/state-schema.md`:

```json
{
  "schemaVersion": 5,
  "runId": "<slug>-<utc-timestamp>",
  "slug": "<slug>",
  "ticketRef": "<the id/key/path the tracker convention returned>",
  "ticketUrl": "<url, if the tracker has one>",
  "domainPath": "<domain-path>",
  "workspaceRoot": "<workspace-root>",
  "isComplex": null,
  "decisionsPath": "<workspace-root>/1-decisions.md",
  "prdPath": "<resolved docs.prd path, or null>",
  "capabilityLogPath": "<the capability's decisions log, or null>",
  "figma": [],
  "designPath": null,
  "specPath": null,
  "architecturePath": null,
  "units": [],
  "createdAt": "<iso8601, now>",
  "updatedAt": "<iso8601, now>"
}
```

`capabilityLogPath` points at the permanent decisions log for the capability this work belongs
to, when the project keeps them (`~/.claude/conventions/doc-contracts/decisions-log.md`; look for `docs/decisions/` or
a pointer from the domain's `CLAUDE.md`). Set it at creation — `/grill-with-docs` reads it
before its first question. `null` is the right value for work spanning more than one capability,
and is a decision, not a skipped field; record why in `1-decisions.md`.

`isComplex` and the doc paths start `null` — `/grill-with-docs` and `/to-spec` fill them in as
the effort progresses. `units` holds the ticket's one unit when `prUnit` is `ticket` (shape in
the branch table above); with `sub-issue` it starts `[]` and fills in once `/to-issues` runs. `runId` is
`<slug>-<utc-timestamp>`; `createdAt`/`updatedAt` both start at creation time and `updatedAt`
moves forward on every later write, per `references/state-schema.md`'s validation routine.

### 5. Commit

Once the writer has joined, commit on the branch from step 4 — one commit, staged by path
(`git add <workspace-root>/state.json`, plus `prd.md` when written, plus
any workspace files wired skills wrote, plus the ticket file if the tracker keeps local
files; never `-A`). Commit per `${CLAUDE_PLUGIN_ROOT}/contracts/commit.md`: type `docs`,
subject `open <slug> workspace`, issue = `ticketRef`. Do not push — `/ship` pushes the branch.

### 6. Hand off

Tell the user the ticket reference/URL, the workspace path, the PRD path (if written), the wired
skills that ran, and the branch (+ worktree path, when `isolation` is `worktree`). Then end your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /grill-with-docs <ticket-id-or-slug>
```
