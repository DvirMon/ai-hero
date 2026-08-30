---
name: to-spec
description: Turn the current conversation (and, when one exists, a ticket workspace's decisions) into a spec — plus an architecture doc when the work is complex — and publish it to the project issue tracker. No interview, just synthesis of what's already been decided.
disable-model-invocation: true
---

This skill takes the current conversation context and codebase understanding — plus, if a ticket workspace exists, its `decisions.md` (path from `state.json`'s `decisionsPath`) and the ticket it was grilled from — and produces a spec (you may know this document as a PRD). Do NOT interview the user — just synthesize what's already been decided. If nothing's been decided yet and a ticket workspace exists, run `/grill-with-docs` first.

If no ticket workspace's `state.json` exists yet, don't skip workspace tracking — create it now per `/to-ticket`'s `state.json` format and workspace-root rule, asking the user for whatever required fields you can't derive yourself (at minimum `slug`; `ticketRef`/`ticketUrl` can stay `null` if there's no tracked ticket).

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-skills` if not.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

Check with the user that these seams match their expectations.

3. Write the spec using the template below. If the ticket workspace's `state.json` exists, also write it to `<workspaceRoot>/spec.md` (using `state.json`'s `workspaceRoot`) and update `state.json`'s `specPath` and `checklist.spec = true`.

4. If the ticket workspace's `state.json` exists and `isComplex` is `true`, also write `<workspaceRoot>/architecture.md`: the decisions that are settled and not open for relitigation, grounded against the actual current source (cite real file paths, not assumptions), the types/interfaces/contracts involved, a file-layout table for the implementation session, and open questions still unresolved. Unlike the spec template below — which bans file paths and code snippets because a spec can sit unimplemented for a while — the architecture doc **may** include exact paths, types, and snippets: it's consumed immediately by `/to-tasks`, not left to go stale. Update `state.json`'s `architecturePath`.

5. Publish the spec to the project issue tracker, and apply the `ready-for-agent` triage label - no need for additional triage. If `architecture.md` was written, link it from the issue body rather than inlining it.

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

</spec-template>

End your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /to-issues <ticket-id-or-slug>
```
