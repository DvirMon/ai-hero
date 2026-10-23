---
name: grill-with-docs
description: A relentless interview to sharpen a ticket, plan, or design — one question at a time — logging decisions as they crystallize and building the domain model (ADRs, glossary) alongside. Decides whether the resulting spec will need an architecture doc.
disable-model-invocation: true
portedFrom: '44459b5da31a'
portedSelf: d64aee8c06d9
---

# Grill (with docs)

Sharpen a rough ask into something precise enough to spec, by interviewing — one question at a time, not a form to fill in bulk. Every answer either resolves a question or opens a sharper one; keep pulling the thread until nothing looks fuzzy.

## Starting material

If a ticket workspace's `state.json` exists in context (created by `/to-ticket`; its root varies — repo-root `docs/tickets/<slug>/` by default, or `apps/<name>/specs/<slug>/`/`packages/<name>/specs/<slug>/` for a monorepo project — see `/to-ticket`), fetch the ticket it points at (`ticketRef`, via `docs/agents/ticket-tracker.md`'s "fetch the intake ticket" convention) and use it as the interview's starting material — this is what you're sharpening.

If no `state.json` exists yet, don't just fall back silently — create the workspace now, using `/to-ticket`'s `state.json` format and workspace-root rule (repo-root `docs/tickets/<slug>/` default, or `apps/<name>/specs/<slug>/` monorepo override). Ask the user for whatever required fields you can't derive yourself — at minimum a `slug`, and whether there's an existing `ticketRef`/`ticketUrl` to link or this should start with those `null`. Then proceed with the interview from whatever's in the conversation.

## Process

0. If the starting material describes more than one sub-feature, apply
   `decompose-by-dependency-graph` before interviewing anything: list the sub-features, map
   dependency edges between them, rank core/independent/dependent. Grill core and independent
   nodes fully now; dependent nodes only after their upstream settles. Record the ranking in
   `decisions.md` alongside the decisions it produces.

0b. **Grill per handoff aspect, not as one spec** (rule `lock-by-aspect-for-handoff`). Split the
   ticket by what one team consumes, e.g. backend contract (model + missing endpoints), FE
   behavior requirements, FE design check, email/content, audit events. Put an `## Aspects` table
   (aspect, hand-off team, status) at the top of `decisions.md`. Grill one aspect at a time,
   checking it against the **whole ticket**, and keep its open gaps as a `- [ ]` checklist under
   it. When the checklist is empty, mark it `locked <date>` and tell the user right away:
   "Aspect N is locked, ready to hand to <team>", with a short handoff summary. Don't hold it for
   the other aspects. A later decision that changes a locked aspect marks it `reopened` and says
   so explicitly. Steps 4–6 run per aspect as it locks; the grill as a whole finishes when every
   aspect is locked.

1. Read the starting material fully before asking anything — don't make the user repeat what they've already told you.
2. Ask one question at a time. Prefer questions that expose an edge case, a scenario the starting material didn't cover, or a decision that was left implicit. Keep going until you can't find another fuzzy edge — don't stop early just because the obvious questions are exhausted.
3. The moment an answer settles something, write it down — don't wait until the end to reconstruct it from memory:
   - If it's project-wide (a term, a naming convention, an architectural stance that outlives this ticket) → invoke `/domain-modeling` to record it in the glossary or an ADR.
   - If it's scoped to this ticket → append it to the workspace's `decisions.md` (its path is `state.json`'s `decisionsPath`; create the file if it doesn't exist yet) as a dated one-line bullet — the decision, not the discussion that led to it.
4. Before finishing, verify failure modes are exhausted. Don't use a fixed question list — first reason about what kind of system this is (UI component, form field, API endpoint, background job, state machine, webhook, etc.), then derive what can go wrong *for that specific domain*. A button has different failure surfaces than a file uploader, a Node.js job, or a multi-step wizard. Pull each failure thread until nothing is left fuzzy, then record the answers in `decisions.md`.

5. Before finishing, decide complexity: does implementing this safely need more than a PRD — new types/interfaces, a non-obvious file layout, a design that needs grounding against existing source before anyone builds it? If yes, set `isComplex: true`; otherwise `false`. This is about implementation risk, not ticket size — a small-sounding change to a shared abstraction can still need an architecture doc.
6. If the ticket workspace's `state.json` exists, update it: set `isComplex`, set `checklist.grill = true`.

**Update the source issue's `## Pipeline` block** (format: `to-issues`, "The Pipeline block"):
set `workspace` to the workspace root, and move `readiness` down one rung — to `needs:spec`,
or straight to `needs:issues` if the grilling settled the contract as well. Record the new
rung's dated reason.

`state.json` owns `grill`/`spec` once a workspace exists, so drop those lines from the block
rather than keeping a second copy. Edit the issue body in place using the tracker's own CLI and
re-sync the rung label in the same turn.

Since the workspace is now created (either by `/to-ticket` or by step 0 above), steps 3 and 5 always apply — write `decisions.md` and update `state.json` as you go.

6. `/to-spec` has `disable-model-invocation: true` — it cannot be launched programmatically from here, only typed by the user. Reference whatever grounds the synthesis: name the workspace's `decisionsPath` (and `ticketRef`, if set). Then end your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /to-spec <ticket-id-or-slug>
```
