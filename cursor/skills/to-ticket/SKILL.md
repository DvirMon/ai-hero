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
choosing the right skill to follow for each `code` task step, so don't leave it `null`.

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

Links to designs, prior PRs, recordings, related tickets, or existing test examples.

</feature-ticket-template>

Omit a section entirely rather than leaving it filled with a placeholder — a missing "How to reach it in the UI" is a signal this is backend work, not a gap to fill with N/A.

### 3. Create the ticket

Follow `docs/agents/ticket-tracker.md`'s "When a skill says 'create an intake ticket'" convention.

### 4. Initialize the ticket workspace

Every effort in this pipeline has a workspace directory, where `<slug>` is a short kebab-case name derived from the ticket title. Decide the workspace **root**:

- **Default**: `docs/tickets/<slug>/` at the repo root.
- **Monorepo override**: if `ticketRef` resolves to a path under `apps/<name>/` or `packages/<name>/` (e.g. a backlog row like `apps/<name>/BACKLOG.md#T-03`, or the ticket is otherwise unambiguously scoped to that project), use `apps/<name>/specs/<slug>/` (or `packages/<name>/specs/<slug>/`) instead — this colocates per-project ticket work with its project instead of pooling everything at the repo root. Apply this whenever the owning project is unambiguous; fall back to the repo-root default otherwise.

This skill creates the workspace; every later stage (`/grill-with-docs`, `/to-spec`, `/to-issues`, `/to-tasks`) reads and extends it purely via the paths recorded in `state.json` below — they read `workspaceRoot`/`decisionsPath`/`specPath`/`architecturePath` rather than reconstructing or assuming a root themselves. This is documented here, once.

Write `<workspace-root>/state.json` (substituting whichever root was decided above):

```json
{
  "slug": "<slug>",
  "ticketRef": "<the id/key/path the tracker convention returned>",
  "ticketUrl": "<url, if the tracker has one>",
  "stack": "react | angular | node | none",
  "isComplex": null,
  "workspaceRoot": "<workspace-root>",
  "decisionsPath": "<workspace-root>/decisions.md",
  "specPath": null,
  "architecturePath": null,
  "githubIssues": [],
  "checklist": { "intake": true, "grill": false, "spec": false, "issues": false, "tasks": false }
}
```

`isComplex` and the doc paths start `null` — `/grill-with-docs` and `/to-spec` fill them in as the effort progresses. `githubIssues` fills in once `/to-issues` runs.

`stack` is set here and read when executing the task plan, paired with each step file's
`Task type` to decide which stack-specific skill to follow. It is the only such field that
belongs to the whole ticket — per-step routing lives in the step files `/to-tasks` writes.

### 5. Hand off

Tell the user the ticket reference/URL and the workspace path. Then end your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /grill-with-docs <ticket-id-or-slug>
```
