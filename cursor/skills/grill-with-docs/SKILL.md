---
name: grill-with-docs
description: A relentless interview to sharpen a ticket, plan, or design — one question at a time — logging decisions as they crystallize and building the domain model (ADRs, glossary) alongside. Decides whether the resulting spec will need an architecture doc.
disable-model-invocation: true
portedFrom: 44459b5da31a
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

   **Move to Wayfinder when it outgrows one session.** If the ranking shows more core nodes
   than one session can settle (a rough guide: more than ~5), or a core node depends on
   investigation nobody has done yet, stop and offer `/wayfinder` with the ticket as its idea.
   Do the same later, at any point the grill clearly will not finish in this session. Decisions
   already settled stay in `decisions.md`; the map links to them instead of re-deciding them.
   The user decides — continuing the grill is a valid answer.

1. Read the starting material fully before asking anything — don't make the user repeat what they've already told you.

1a. **Read what was already decided, before the first question.** Two sources:
   - the glossary: `CONTEXT.md`, or the one `CONTEXT-MAP.md` points to for this area
     (layout per `/domain-modeling`);
   - the ADRs that touch the area (`docs/adr/`, system-wide and context-level).

   Ask in the glossary's words. A missing source is a finding: say so ("no glossary for this
   area yet") rather than treating absence as "nothing was decided".

   **Know why a fence stands before moving it.** Before proposing to change, merge or replace
   an existing concept, cite the ADR or glossary entry that set it up, and say what the change
   would break. If no record explains it, ask the user why it exists before asking whether to
   change it.

1b. **Facts come from the code, not the user.** Only decisions and preferences go to the user.
   List the facts your questions depend on that the code can answer (how a module behaves
   today, what already exists). Look them up yourself, in one reading pass, before asking any
   question that depends on them.

   **The first question is about intent, never a fact.** Ask what hurts today or what the
   change is for — something only the user knows ("what bothers you in the teleprompter
   now?"). Ask fact-dependent questions ("what does it read from?") only after the reading
   pass, and drop any it already answered.
2. Ask one question at a time. Prefer questions that expose an edge case, a scenario the starting material didn't cover, or a decision that was left implicit. Keep going until you can't find another fuzzy edge — don't stop early just because the obvious questions are exhausted.
3. The moment an answer settles something, write it down — don't wait until the end to reconstruct it from memory:
   - If it's project-wide (a term, a naming convention, an architectural stance that outlives this ticket) → invoke `/domain-modeling` to record it in the glossary or an ADR.
   - If it's scoped to this ticket → append it to the workspace's `decisions.md` (its path is `state.json`'s `decisionsPath`; create the file if it doesn't exist yet) as a dated one-line bullet — the decision, not the discussion that led to it.
4. Before finishing, verify failure modes are exhausted. Don't use a fixed question list — first reason about what kind of system this is (UI component, form field, API endpoint, background job, state machine, webhook, etc.), then derive what can go wrong *for that specific domain*. A button has different failure surfaces than a file uploader, a Node.js job, or a multi-step wizard. Pull each failure thread until nothing is left fuzzy, then record the answers in `decisions.md`.

4b. **Before finishing, check the names.** The grill is not done while the feature is still
   described in loose words. List every noun the feature introduces or changes (an entity, a
   state, an action a user takes). Each one ends in exactly one of:
   - a glossary entry, written through `/domain-modeling`;
   - an explicit "reuses `<term>`", naming an existing glossary entry.

   Challenge each proposed term against the existing definitions before accepting it. A term
   whose definition conflicts with one already in the glossary (same word, other meaning; or
   a new word for an existing concept) is a question for the user, not a rename you make
   alone. The user may accept a term as provisional: log it as open in `decisions.md`.

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
