---
name: grill-with-docs
description: A relentless interview to sharpen a ticket, plan, or design — one question at a time — logging decisions as they crystallize and building the domain model (ADRs, glossary) alongside. Decides whether the resulting spec will need an architecture doc.
disable-model-invocation: true
---

# Grill (with docs)

Sharpen a rough ask into something precise enough to spec, by interviewing — one question at a time, not a form to fill in bulk. Every answer either resolves a question or opens a sharper one; keep pulling the thread until nothing looks fuzzy.

## Starting material

If a ticket workspace's `state.json` exists in context (created by `/to-ticket`; its root is `<domain-path>/docs/work/<slug>/` — see `/to-ticket`), validate it per `to-ticket/references/state-schema.md`, then fetch the ticket it points at (`ticketRef`, via `docs/agents/ticket-tracker.md`'s "fetch the intake ticket" convention) and use it as the interview's starting material — this is what you're sharpening.

If no `state.json` exists yet, don't just fall back silently — create the workspace now, using `/to-ticket`'s `state.json` format and workspace-root rule (`<domain-path>/docs/work/<slug>/`, resolving `<domain-path>` per `/to-ticket`'s rule — ask rather than guess). Ask the user for whatever required fields you can't derive yourself — at minimum a `slug`, and whether there's an existing `ticketRef`/`ticketUrl` to link or this should start with those `null`. Then proceed with the interview from whatever's in the conversation.

## Process

0. If the starting material describes more than one sub-feature, apply
   `decompose-by-dependency-graph` before interviewing anything: list the sub-features, map
   dependency edges between them, rank core/independent/dependent. Grill core and independent
   nodes fully now; dependent nodes only after their upstream settles. Record the ranking in
   `1-decisions.md` alongside the decisions it produces.

1. Read the starting material fully before asking anything — don't make the user repeat what they've already told you.
2. Ask one question at a time. Prefer questions that expose an edge case, a scenario the starting material didn't cover, or a decision that was left implicit. Keep going until you can't find another fuzzy edge — don't stop early just because the obvious questions are exhausted.
3. The moment an answer settles something, write it down — don't wait until the end to reconstruct it from memory:
   - If it's project-wide (a term, a naming convention, an architectural stance that outlives this ticket) → invoke `/domain-modeling` to record it in the glossary or an ADR.
   - If it's scoped to this ticket → append it to the workspace's `1-decisions.md` (its path is `state.json`'s `decisionsPath`; create the file if it doesn't exist yet) as a dated one-line bullet — the decision, not the discussion that led to it.
   - **If it outlives this ticket but binds only one capability** (how that feature behaves, a shape it committed to, a scope-out) → it *also* gets a row in that capability's decisions log, `state.json`'s `capabilityLogPath`. Write the row when the decision settles, not at the end: a log that is only filled in at archive time is the failure this log exists to prevent. Format and numbering: `doc-contracts/decisions-log.md`. The ticket's own `1-decisions.md` keeps the full rationale; the log row is one line that links to it.

   The three are not exclusive — an architectural stance that binds one capability is an ADR *and* a log row pointing at it.

   **Every `1-decisions.md`, capability-log and `state.json` write goes to a `haiku` writer**,
   per `to-ticket/references/file-writes.md` — you hand it the finished line, so the write is
   mechanical. The first write spawns it, every later one resumes it with `SendMessage`. Ask
   the next question straight away — don't wait on the write. Join the writer before step 6's
   Pipeline-block update and the final message. `/domain-modeling` keeps its own writers.

   **Before opening the first question, read that log.** It is what stops the interview re-deciding something already settled, or reversing it without noticing. If the capability has no log yet, say so rather than treating its absence as "nothing was decided before".
4. Before finishing, verify failure modes are exhausted. Don't use a fixed question list — first reason about what kind of system this is (UI component, form field, API endpoint, background job, state machine, webhook, etc.), then derive what can go wrong *for that specific domain*. A button has different failure surfaces than a file uploader, a Node.js job, or a multi-step wizard. Pull each failure thread until nothing is left fuzzy, then record the answers in `1-decisions.md`.

5. Before finishing, decide complexity: does implementing this safely need more than a PRD — new types/interfaces, a non-obvious file layout, a design that needs grounding against existing source before anyone builds it? If yes, set `isComplex: true`; otherwise `false`. This is about implementation risk, not ticket size — a small-sounding change to a shared abstraction can still need an architecture doc.
6. If the ticket workspace's `state.json` exists, validate it per
   `to-ticket/references/state-schema.md`, then update it: set `isComplex`, refresh `updatedAt`.

**Update the source issue's `## Pipeline` block** (contract: `to-issues/references/pipeline-block.md`):
set `workspace` to the workspace root, set `grill: done: <decisionsPath>`, and move `readiness`
down one rung — to `needs:spec`, or straight to `needs:issues` if the grilling settled the
contract as well. Record the new rung's dated reason.

The block is the single record of `grill`/`spec` status — `state.json` carries no duplicate of
it. Edit the issue body in place (`gh issue edit <n> --body-file -`) and re-sync the rung label
in the same turn.


Since the workspace is now created (either by `/to-ticket` or by step 0 above), steps 3 and 5 always apply — write `1-decisions.md` and update `state.json` as you go.

7. `/to-spec` has `disable-model-invocation: true` — it cannot be launched programmatically from here, only typed by the user. Reference whatever grounds the synthesis: name the workspace's `decisionsPath` (and `ticketRef`, if set). Then end your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /to-spec <ticket-id-or-slug>
```
