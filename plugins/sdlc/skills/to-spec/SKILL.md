---
name: to-spec
description: Turn the current conversation (and, when one exists, a ticket workspace's decisions) into a spec checklist — plus an architecture doc when the work is complex and a design doc when Figma frames exist. The spec stays local; it is never published to a tracker. No interview, just synthesis of what's already been decided.
disable-model-invocation: true
---

This skill takes the current conversation context and codebase understanding — plus, if a ticket workspace exists, its `decisions.md` (path from `state.json`'s `decisionsPath`, format `${CLAUDE_PLUGIN_ROOT}/contracts/ticket-decisions.md` — a settled entry is never re-asked) and the ticket it was grilled from — and produces a spec: a checklist for the agent, derived from the decisions. User stories live in the PRD (`prdPath`, `${CLAUDE_PLUGIN_ROOT}/contracts/prd.md`), never in the spec. Do NOT interview the user — just synthesize what's already been decided. If nothing's been decided yet and a ticket workspace exists, run `/grill-with-docs` first.

**Branch guard, first.** The spec is committed on the epic's planning branch, `docs/<slug>`
(the `slug` in `state.json`), in its worktree. On the default branch or an issue branch, stop
and point the user to `/to-ticket`, which starts it via `${CLAUDE_PLUGIN_ROOT}/skills/to-tasks/references/start-branch.md`.

If a ticket workspace's `state.json` exists, validate it per `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/state-schema.md` before reading it. A version-3 file is read through that schema's § Reading version 3 mapping; every write is version 4.

If it carries a non-null `capabilityLogPath`, **read that log too.** It holds what earlier efforts on the same capability already settled, superseded or left open — which this workspace's own decisions file does not, and which a spec is worse than useless for contradicting. Any decision the spec makes that binds the capability beyond this ticket gets a row in that log, per `~/.claude/conventions/doc-contracts/decisions-log.md`.

If no ticket workspace's `state.json` exists, stop and point to `/to-ticket`. It is the only stage that creates a workspace.

The repo's `docs/agents/ticket-tracker.md` and `docs/agents/issue-tracker.md` (contract: `${CLAUDE_PLUGIN_ROOT}/contracts/tracker.md`) should have been provided to you — run `/setup-skills` if not.

**PRD gate, before step 1.** When `prdPath` is set:

1. **Re-fetch the remote ACs once**, through `ticket-tracker.md` `## Fetch` for `ticketRef`.
   Compare each against its `[<ticketRef> · MM-DD]` line in `prd.md`. A changed AC gets its new
   text and today's pull date; list every changed line to the user before building the
   checklist. A new remote AC is added with its tag; a removed one is listed, not deleted.
   **`library` / `design-system`:** the capability PRD holds no ticket ACs. Read them straight
   from the fetch as checklist input, each tagged `[<ticketRef> · MM-DD]`.
2. **Stop on an open `⚠ Dn`.** Any line still marked `⚠` blocks the spec — product owns the AC.
   On a library / DS ticket, check the `⚠ <KEY> AC` entries in `decisionsPath` instead.
   It clears only per `${CLAUDE_PLUGIN_ROOT}/contracts/prd.md` § Conflict marker: the re-fetch above shows product
   updated the ticket, or `decisionsPath` holds an override entry `Dm` naming `Dn` (then rewrite
   the line to the decision, tag `[Dm]`, drop the marker). Otherwise name the open lines and
   stop.

`prdPath` null (a v3 workspace, or no PRD): ask the user for the path or confirm there is none,
then skip the gate.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

Check with the user that these seams match their expectations.

3. Write the spec using the checklist template below. If the ticket workspace's `state.json` exists, also write it to `<workspaceRoot>/2-spec.md` (using `state.json`'s `workspaceRoot`) and update `state.json`'s `specPath` and `updatedAt`.

   **Design reference (`design.md`).** When `figma[]` is non-empty, or `{workspaceRoot}/design.draft/`
   has fragments, or `decisionsPath` records a locked FE design-check aspect, also write
   `<workspaceRoot>/design.md` per `references/design-reference.md` (merge drafts + grill
   decisions into the locked component/token/copy maps). Set `designPath` to that path and add a
   **Design reference** section in `2-spec.md` that links to `design.md` only — do not duplicate
   the tables. When there is no Figma surface, leave `designPath` null and omit the section.

   A decision settled while writing the spec is appended to `decisionsPath` as an entry per
   `${CLAUDE_PLUGIN_ROOT}/contracts/ticket-decisions.md`, phase `spec`.

   **These writes — step 3's `design.md`, step 4's `3-architecture.md`, any decisions entry and
   any capability-log row — go to one `haiku` writer**, per `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/file-writes.md`. Compose every
   file's full text here and hand it over verbatim, so the write is mechanical. Join the
   writer before step 5's commit.

   Record the stage through `issue-tracker.md` `## Readiness` (contract:
   `${CLAUDE_PLUGIN_ROOT}/skills/to-issues/references/pipeline-block.md`): `workspace` = the workspace root,
   `grill: done: <decisionsPath>`, `spec: done: <specPath>`, and `readiness` per `to-issues`'
   ladder, with the `assessed:` line. You set every rung yourself, `ready-for-agent` included.

   Rate the work's **difficulty**, not its breadth, and let that set the rung. Full trigger
   list and the breadth-vs-difficulty rule: `${CLAUDE_PLUGIN_ROOT}/skills/to-issues/references/pipeline-block.md`. Applied
   to a spec, it comes out as:

   - **3+ modules or >~6 acceptance criteria** → `needs:issues`. The spec needs slicing.
   - Otherwise **high** difficulty — a new seam, an interaction between existing mechanisms,
     an open question → `needs:tasks`.
   - Otherwise **low or moderate** — a deletion, a mechanical edit the spec already
     enumerates, a few files with one named trap → **propose `ready-for-agent`**.
     `/to-tasks` would only re-list the spec body.

   Never leave a rung standing that its own `assessed:` line contradicts. A spec that
   enumerates the whole edit and rates it low, then sits at `needs:tasks`, is that
   contradiction.

4. If the ticket workspace's `state.json` exists and `isComplex` is `true`, also write `<workspaceRoot>/3-architecture.md`: the decisions that are settled and not open for relitigation, grounded against the actual current source (cite real file paths, not assumptions), the types/interfaces/contracts involved, a file-layout table for the implementation session, and open questions still unresolved. Unlike the spec template below — which bans file paths and code snippets because a spec can sit unimplemented for a while — the architecture doc **may** include exact paths, types, and snippets: it's consumed immediately by `/to-tasks`, not left to go stale. Update `state.json`'s `architecturePath`.

<spec-template>

## Goal

One line, linking the PRD (`prdPath`) for the problem and the user stories. Do not restate
them.

## Checklist

A numbered list of what the agent must make true, each item derived from a decision or a PRD
requirement and carrying its source tag (`[Dn]` or `[<ticketRef> · MM-DD]`). One checkable
behavior or edge case per item.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Any further notes about the feature.

## Design reference

(Omit when `designPath` is null.) Link only — e.g. `See [design.md](./design.md) for Figma
frames, component map, tokens, typography, and copy → i18n keys. Do not restate those tables here.

</spec-template>

5. **Commit.** Join the writer, then make one commit on `docs/<slug>`, staged by path:
   `2-spec.md`, `design.md` (if written), `3-architecture.md` (if written), `prd.md` (if the gate
   changed it), `state.json`, any capability-log row. Never `-A`. Message per `atomic-commit` § Commit format: `📚 docs(<scope>): spec <slug>`, trailer
   `Refs:` the `ticketRef`, per `issue-tracker.md` `## Issue references`. Do not push — `/ship` does, after `/to-issues`.

End your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /to-issues <ticket-id-or-slug>
```
