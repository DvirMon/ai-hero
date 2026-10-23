---
name: to-spec
description: Turn the current conversation (and, when one exists, a ticket workspace's decisions) into a spec — plus an architecture doc when the work is complex — and publish it to the project issue tracker. No interview, just synthesis of what's already been decided.
disable-model-invocation: true
---

This skill takes the current conversation context and codebase understanding — plus, if a ticket workspace exists, its `decisions.md` (path from `state.json`'s `decisionsPath`, format `doc-contracts/ticket-decisions.md` — a settled entry is never re-asked) and the ticket it was grilled from — and produces a spec (you may know this document as a PRD). Do NOT interview the user — just synthesize what's already been decided. If nothing's been decided yet and a ticket workspace exists, run `/grill-with-docs` first.

**Branch guard, first.** The spec is committed on the epic's planning branch, `docs/<slug>`
(the `slug` in `state.json`), in its worktree. On the default branch or an issue branch, stop
and point the user to `/to-ticket`, which starts it via `to-tasks/references/start-branch.md`.

If a ticket workspace's `state.json` exists, validate it per `to-ticket/references/state-schema.md` before reading it.

If it carries a non-null `capabilityLogPath`, **read that log too.** It holds what earlier efforts on the same capability already settled, superseded or left open — which this workspace's own decisions file does not, and which a spec is worse than useless for contradicting. Any decision the spec makes that binds the capability beyond this ticket gets a row in that log, per `doc-contracts/decisions-log.md`.

If no ticket workspace's `state.json` exists yet, don't skip workspace tracking — create it now per `/to-ticket`'s `state.json` format and workspace-root rule, asking the user for whatever required fields you can't derive yourself (at minimum `slug`; `ticketRef`/`ticketUrl` can stay `null` if there's no tracked ticket).

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-skills` if not.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

Check with the user that these seams match their expectations.

3. Write the spec using the template below. If the ticket workspace's `state.json` exists, also write it to `<workspaceRoot>/2-spec.md` (using `state.json`'s `workspaceRoot`) and update `state.json`'s `specPath` and `updatedAt`.

   **Design reference (`design.md`).** When `figma[]` is non-empty, or `{workspaceRoot}/design.draft/`
   has fragments, or `decisionsPath` records a locked FE design-check aspect, also write
   `<workspaceRoot>/design.md` per `references/design-reference.md` (merge drafts + grill
   decisions into the locked component/token/copy maps). Set `designPath` to that path and add a
   **Design reference** section in `2-spec.md` that links to `design.md` only — do not duplicate
   the tables. When there is no Figma surface, leave `designPath` null and omit the section.

   A decision settled while writing the spec is appended to `decisionsPath` as an entry per
   `doc-contracts/ticket-decisions.md`, phase `spec`.

   **These writes — step 3's `design.md`, step 4's `3-architecture.md`, any decisions entry and
   any capability-log row — go to one `haiku` writer**, per `to-ticket/references/file-writes.md`. Compose every
   file's full text here and hand it over verbatim, so the write is mechanical. Continue with
   step 5's tracker search and publish while it writes — you already hold the content. Join the
   writer before step 6's commit.

   Update the source issue's `## Pipeline` block (contract: `to-issues/references/pipeline-block.md`): set
   `workspace` to the workspace root, set `grill: done: <decisionsPath>` and
   `spec: done: <specPath>`, and set `readiness` per `to-issues`' ladder. Re-sync the rung label
   in the same turn.

   Rate the work's **difficulty**, not its breadth, and let that set the rung. Full trigger
   list and the breadth-vs-difficulty rule: `to-issues/references/pipeline-block.md`. Applied
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

5. Before publishing, check whether a spec issue for this `ticketRef` already exists: look at
   `state.json.githubIssues` for a prior spec issue reference, and search the tracker directly
   (`gh issue list --state all --search "<ticketRef> in:body" --json number,title,body`). If
   found, update that issue's body in place rather than creating a new one.

   `githubIssues[]` is read here — this is one of its two documented consumers (the other is
   `ship`); see `to-ticket/references/state-schema.md`. The tracker search remains the
   authoritative half regardless — `githubIssues[]` is a fast path, not the source of truth.

   Publish the spec to the project issue tracker (creating only if no existing issue was found)
   and re-sync the rung label to the readiness step 3 assessed. You set every rung yourself,
   `ready-for-agent` included, with the difficulty evidence in the `assessed:` line
   (`to-issues/references/pipeline-block.md`). If `3-architecture.md` was written, link it from the issue body rather
   than inlining it.

<spec-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

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

6. **Commit.** Join the writer, then make one commit on `docs/<slug>`, staged by path:
   `2-spec.md`, `design.md` (if written), `3-architecture.md` (if written), `state.json`, any
   capability-log row. Never `-A`. Message per `atomic-commit` § Commit format: `📚 docs(<scope>): spec <slug>`, trailer
   `Refs: #<spec issue>` from step 5. Do not push — `/ship` does, after `/to-issues`.

End your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /to-issues <ticket-id-or-slug>
```
