---
name: to-ticket
description: Turn a freeform product ask into a rough, product-level ticket — the intake stage before grilling and spec work begin. Initializes the ticket workspace the rest of the pipeline reads from.
disable-model-invocation: true
---

# To Ticket

Turn a freeform product ask into a **ticket** — a rough, product-level description of what's wanted, not an engineering-detailed spec. This is the intake stage: it exists to get the ask into the tracker quickly, before anyone commits to interviewing it or writing a spec.

The ticket tracker should have been provided to you — run `/setup-skills` if `docs/agents/ticket-tracker.md` doesn't exist.

## Process

### 1. Gather context

Work from whatever the user has already described. Ask only enough to make the ticket useful — a title and a paragraph of intent, not a full requirements gathering (that's `/grill-with-docs`'s job, next). Do not interview.

One extra thing to pin down: the ticket's **stack** — `react`, `angular`, `node`, or `none`
(docs/chore work with no code). Infer it from the owning project's dependencies if the ticket
is unambiguously scoped to one; ask only if you genuinely can't tell. This is what lets
`/impel` route each task step to the right implementer agent, so don't leave it `null`.

### 2. Draft the ticket

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

### 3. Create the ticket

Follow `docs/agents/ticket-tracker.md`'s "When a skill says 'create an intake ticket'" convention.

### 4. Initialize the ticket workspace

Every effort in this pipeline has a workspace directory, where `<slug>` is a short kebab-case name derived from the ticket title. The workspace root is always `<domain-path>/docs/work/<slug>/` — domain-colocated, per `docs/agents/ticket-tracker.md`. There is no repo-root default; `<domain-path>` must be resolved first.

**Resolving `<domain-path>`** — never guess silently:

1. If the user already named the domain path (in this conversation, or as an argument), use it.
2. Otherwise, try to derive it from the ticket's subject: does the ask map cleanly to one workspace project (`apps/<name>/`, `packages/<name>/`, `libs/<name>/`)? If `ticketRef` itself resolves to a path under one of those (e.g. a backlog row like `apps/<name>/BACKLOG.md#T-03`), that's a strong signal.
3. If a derivation was made in step 2, **confirm it with the user** before writing anything — state the derived path and ask them to confirm or correct it. Do not proceed on an unconfirmed guess.
4. If neither 1 nor 2 resolves cleanly, ask the user directly for the domain path.

**Start the planning branch before writing anything.** Planning never happens on the default
branch: the whole epic's planning docs (`/to-ticket` → `/to-issues`) ship as one PR from
`docs/<slug>`, and each issue later gets its own branch off `main`. Run
`to-tasks/references/start-branch.md` with branch `docs/<slug>` once `<domain-path>` and
`<slug>` are settled — it prunes merged work, refuses a dirty tree, creates the worktree off
`origin/main` and enters it. Every path below then resolves inside that worktree. On resume
(the existing-workspace case below), switch to the existing `docs/<slug>` worktree instead of
creating a new one; if its planning PR already merged, the workspace is on `main` and resuming
it means a new `docs/<slug>-<topic>` branch from the same procedure.

This skill creates the workspace; every later stage (`/grill-with-docs`, `/to-spec`, `/to-issues`, `/to-tasks`) reads and extends it purely via the paths recorded in `state.json` below — they read `workspaceRoot`/`decisionsPath`/`capabilityLogPath`/`specPath`/`architecturePath` rather than reconstructing or assuming a root themselves. This is documented here, once.

The full field-by-field schema (owner, consumer, and the validation routine every state-reading
skill follows) lives in `references/state-schema.md` — this section only shows the shape being
written.

This skill records the ticket's reference and URL in `state.json` only — it does **not** write a local snapshot of the ticket body to any file in the workspace. The ticket itself lives in the external tracker `docs/agents/ticket-tracker.md` configured; `ticketRef`/`ticketUrl` are the pointer back to it.

**Before writing anything**, check whether `<workspace-root>` already exists. If it does, stop —
do not write the workspace or `state.json`. Tell the user the directory already exists and ask
whether to resume the existing workspace (read its `state.json` and continue the pipeline from
there) or pick a different slug for a new workspace. Never silently overwrite an existing
`state.json` — a re-run of `/to-ticket` on the same slug must not clobber another session's
`decisionsPath`/`specPath`/`architecturePath`/`githubIssues` progress.

Once the check passes, dispatch the write to a `haiku` writer per `references/file-writes.md`
— never inline; the brief carries the full JSON below, filled in. Join it before step 5's
commit, which needs the file on disk.

**Figma capture (UI tickets).** When the ticket or user supplies Figma frame URLs, run
`references/figma-capture.md` **before** the writer finishes `state.json`: parse each frame,
call `get_screenshot` per frame into `<workspace-root>/figma/`, and set `figma[]` on the JSON
below. No design analysis at intake — capture only. Backend-only tickets: `figma: []`.

Write `<workspace-root>/state.json` (substituting whichever root was decided above), per
`references/state-schema.md`:

```json
{
  "schemaVersion": 3,
  "runId": "<slug>-<utc-timestamp>",
  "slug": "<slug>",
  "ticketRef": "<the id/key/path the tracker convention returned>",
  "ticketUrl": "<url, if the tracker has one>",
  "domainPath": "<domain-path>",
  "workspaceRoot": "<workspace-root>",
  "stack": "react | angular | node | none",
  "isComplex": null,
  "decisionsPath": "<workspace-root>/1-decisions.md",
  "capabilityLogPath": "<the capability's decisions log, or null>",
  "figma": [],
  "designPath": null,
  "specPath": null,
  "architecturePath": null,
  "githubIssues": [],
  "createdAt": "<iso8601, now>",
  "updatedAt": "<iso8601, now>"
}
```

`capabilityLogPath` points at the permanent decisions log for the capability this work belongs
to, when the project keeps them (`doc-contracts/decisions-log.md`; look for `docs/decisions/` or
a pointer from the domain's `CLAUDE.md`). Set it at creation — `/grill-with-docs` reads it
before its first question. `null` is the right value for work spanning more than one capability,
and is a decision, not a skipped field; record why in `1-decisions.md`.

`isComplex` and the doc paths start `null` — `/grill-with-docs` and `/to-spec` fill them in as
the effort progresses. `githubIssues` fills in once `/to-issues` runs. `runId` is
`<slug>-<utc-timestamp>`; `createdAt`/`updatedAt` both start at creation time and `updatedAt`
moves forward on every later write, per `references/state-schema.md`'s validation routine.

`stack` is set here and read by `/impel`, which pairs it with each step file's `Task type`
to pick the implementer agent. It is the only routing field that belongs to the whole ticket —
per-step routing lives in the step files `/to-tasks` writes.

### 5. Commit

Once the writer has joined, commit `state.json` on `docs/<slug>` — one commit, staged by path
(`git add <workspace-root>/state.json`, plus `<workspace-root>/figma/` when capture ran, plus
the ticket file if the tracker convention is local files; never `-A`). Message per `atomic-commit` § Commit
format: `📚 docs(<scope>): open <slug> workspace`, trailer `Refs: none` (the epic issue does
not exist until `/to-spec`). Do not push — `/ship` pushes the planning branch after
`/to-issues`.

### 6. Hand off

Tell the user the ticket reference/URL, the workspace path, and the branch + worktree path
(`docs/<slug>` at `<worktree>`). Then end your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /grill-with-docs <ticket-id-or-slug>
```
