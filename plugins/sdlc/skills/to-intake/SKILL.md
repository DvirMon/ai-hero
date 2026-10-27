---
name: to-intake
description: Capture an idea as an intake item on the repo's tracker — one issue or ticket, optionally under an epic — without starting work on it. No branch, no workspace. Returns the ref for `/to-ticket` to pick up later. Use for "capture this idea", "open a ticket for later", "create an issue", "park this", or when `/to-ticket` is called with no ref.
---

# To Intake

Record an idea on the tracker so it isn't lost. This is capture only: nothing is started.
`/to-ticket <ref>` starts the work later, from the ref this skill returns.

## Process

### 1. Resolve the config

Read the workflow config per `${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md` § Reading it. Then load `stages.to-intake.skills` per `${CLAUDE_PLUGIN_ROOT}/contracts/stage-skills.md`.

- **No `.claude/workflow.json`:** stop and point to `/to-ticket` (it runs setup first) or
  `/sdlc:setup`.
- **No `docs/agents/ticket-tracker.md`, or no `## Create an intake item` section in it:** stop
  and name what is missing (`${CLAUDE_PLUGIN_ROOT}/contracts/tracker.md`). Run `/sdlc:setup`.

### 2. Draft the item

Work from what the user said. A title and a short paragraph of intent — what is wanted and
why. Do not interview; that is `/grill-with-docs`, once someone picks the item up.

The item is the PR unit `/to-ticket` will later take (a GitHub issue, a Jira Story or Task —
whatever `ticket-tracker.md` creates).

### 3. Pick the epic

**`prUnit: sub-issue` (GitHub): skip this step.** The item is itself the epic — `/to-issues`
puts its sub-issues under it — so there is no level above it.

Otherwise follow `intake.epic` when it is set, or ask, one question:

- **Link** an existing epic — ask for its ref;
- **Create** a new epic — ask for its title; it is created first, through the same section;
- **None.**

### 4. Create it

Dispatch the `intake-creator` agent (one call) with the title, body, epic choice and the
parked fields below. It follows `docs/agents/ticket-tracker.md` § Create an intake item
exactly — it may be a CLI command, an MCP tool, or `skill:`/`agent:` an org's own tooling
runs — and returns the ref and URL. Drafting and the epic question stay in this session.

**Parked, not assessed.** Publish it with the Pipeline block's epic form
(`${CLAUDE_PLUGIN_ROOT}/skills/to-issues/references/pipeline-block.md` § Epic form): `readiness: needs:triage`, labels
`kind:epic` + `needs:triage`. Do not assess it now; assessment happens when someone wants to
build it. A tracker whose readiness lives elsewhere follows `docs/agents/issue-tracker.md`
§ Readiness instead.

### 5. Return the ref

Print the new ref and its URL, and the next step: `/to-ticket <ref>`.

When `/to-ticket` called this skill, hand the ref back to it and stop; `/to-ticket` continues.

## Never

- Create a branch, worktree, ticket workspace or `state.json`.
- Edit an existing item's description.
- Create children under the item — that is `/to-issues`.
