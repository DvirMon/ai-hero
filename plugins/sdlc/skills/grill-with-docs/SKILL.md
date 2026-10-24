---
name: grill-with-docs
description: A relentless interview to sharpen a ticket, plan, or design — one question at a time — logging decisions as they crystallize and building the domain model (ADRs, glossary) alongside. Decides whether the resulting spec will need an architecture doc.
disable-model-invocation: true
---

# Grill (with docs)

Sharpen a rough ask into something precise enough to spec, by interviewing — one question at a time, not a form to fill in bulk. Every answer either resolves a question or opens a sharper one; keep pulling the thread until nothing looks fuzzy.

## Config and wired skills

Read the workflow config per `${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md` § Reading it. Then load `stages.grill.skills` per `${CLAUDE_PLUGIN_ROOT}/contracts/stage-skills.md`.

## Branch guard

Run this right after. Planning docs are committed on the epic's planning branch,
never on the default branch.

- On `docs/<slug>` (the `slug` in `state.json`), in its worktree → proceed.
- On the default branch, or on an issue branch (`<type>/<N>-<slug>`) → stop. Point the user
  to `/to-ticket`, which starts `docs/<slug>` via `${CLAUDE_PLUGIN_ROOT}/skills/to-tasks/references/start-branch.md`.
- **Exception — a scoped grill on a sub** (`needs:grill` on one slice, after the planning PR
  merged): start `docs/<slug>-<N>` via `${CLAUDE_PLUGIN_ROOT}/skills/to-tasks/references/start-branch.md` and grill there.
  It ships as its own small docs PR before `/to-tasks #N`.

## Starting material

If a ticket workspace's `state.json` exists in context (created by `/to-ticket`; its root is `<domain-path>/docs/work/<slug>/` — see `/to-ticket`), validate it per `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/state-schema.md`, then fetch the ticket it points at (`ticketRef`, via `docs/agents/ticket-tracker.md` `## Fetch`) and use it, with the PRD at `prdPath` (`${CLAUDE_PLUGIN_ROOT}/contracts/prd.md`), as the interview's starting material — this is what you're sharpening.

If no `state.json` exists, grill without a workspace — never create one; only `/to-ticket` does. Ask the user where to keep the decisions log (e.g. `~/.claude/work/<slug>/1-decisions.md`) and append entries there per the ticket-decisions format. Steps that need the workspace — `state.json` updates, `prd.md`, tracker comments, readiness — are skipped.

## Process

0. If the starting material describes more than one sub-feature, apply
   `decompose-by-dependency-graph` before interviewing anything: list the sub-features, map
   dependency edges between them, rank core/independent/dependent. Grill core and independent
   nodes fully now; dependent nodes only after their upstream settles. Record the ranking in
   `1-decisions.md`'s `## Ranking` section (`${CLAUDE_PLUGIN_ROOT}/contracts/ticket-decisions.md`).

0b. **Grill per handoff aspect, not as one spec** (rule `lock-by-aspect-for-handoff`). Split the
   ticket by what one team consumes, e.g. backend contract (model + missing endpoints), FE
   behavior requirements, FE design check, email/content, audit events. Put an `## Aspects` table
   (aspect, hand-off team, status) at the top of `1-decisions.md`, shaped per
   `${CLAUDE_PLUGIN_ROOT}/contracts/ticket-decisions.md` § Aspects. Grill one aspect at a time,
   checking it against the **whole ticket**, and keep its open gaps as a `- [ ]` checklist under
   it. When the checklist is empty, mark it `locked <date>` and tell the user right away:
   "Aspect N is locked, ready to hand to <team>", with a short handoff summary. Don't hold it for
   the other aspects. A later decision that changes a locked aspect marks it `reopened` and says
   so explicitly. Steps 4–6 run per aspect as it locks; the grill as a whole finishes when every
   aspect is locked.

   **Aspects from wired skills** — a wired skill may add an aspect (e.g. `figma:design-check`
   adds the FE design check when the ticket has frames). Run it like any other aspect.

1. Read the starting material fully before asking anything — don't make the user repeat what they've already told you.
2. Ask one question at a time. Prefer questions that expose an edge case, a scenario the starting material didn't cover, or a decision that was left implicit. Keep going until you can't find another fuzzy edge — don't stop early just because the obvious questions are exhausted.
3. The moment an answer settles something, write it down — don't wait until the end to reconstruct it from memory:
   - If it's project-wide (a term, a naming convention, an architectural stance that outlives this ticket) → invoke `/domain-modeling` to record it in the glossary or an ADR.
   - If it's scoped to this ticket → append it to the workspace's `1-decisions.md` (its path is `state.json`'s `decisionsPath`; create the file if it doesn't exist yet) as an entry in the shape of `${CLAUDE_PLUGIN_ROOT}/contracts/ticket-decisions.md`, phase `grill` — the decision, not the discussion that led to it.
   - **If it outlives this ticket but binds only one capability** (how that feature behaves, a shape it committed to, a scope-out) → it *also* gets a row in that capability's decisions log, `state.json`'s `capabilityLogPath`. Write the row when the decision settles, not at the end: a log that is only filled in at archive time is the failure this log exists to prevent. Format and numbering: `~/.claude/conventions/doc-contracts/decisions-log.md`. The log row is one line that links to the ticket's entry, and the entry's `→` tail names the row id.

   The three are not exclusive — an architectural stance that binds one capability is an ADR *and* a log row pointing at it.

   **The PRD at `prdPath`** (`${CLAUDE_PLUGIN_ROOT}/contracts/prd.md` § Source tags, § Conflict marker):
   - **A new requirement** (an acceptance criterion or failure behavior the grill found) → add
     it to `prd.md`, tagged `[Dn]` with its entry's number.
   - **A decision that contradicts a remote AC** (a `[KEY · MM-DD]` line) → product owns the
     AC, so don't overwrite it. Log the entry as *proposed*, append `⚠ Dn` to that AC line,
     and post the question to product through `docs/agents/ticket-tracker.md`
     `## Post a comment` (a repo may implement it as e.g. `skill:jira-grill-comment`).
     `/to-spec` stops until the marker clears. On a library / DS ticket the capability PRD
     has no AC line: put `⚠ <KEY> AC` on the proposed entry instead.

   **Every `1-decisions.md`, capability-log, `prd.md` and `state.json` write goes to a `haiku` writer**,
   per `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/file-writes.md` — you hand it the finished line, so the write is
   mechanical. The first write spawns it, every later one resumes it with `SendMessage`. Ask
   the next question straight away — don't wait on the write. Join the writer before step 6's
   readiness update, step 7's commit and the final message. `/domain-modeling` keeps its own writers.

   **Before opening the first question, read that log.** It is what stops the interview re-deciding something already settled, or reversing it without noticing. If the capability has no log yet, say so rather than treating its absence as "nothing was decided before".
4. Before finishing, verify failure modes are exhausted. Don't use a fixed question list — first reason about what kind of system this is (UI component, form field, API endpoint, background job, state machine, webhook, etc.), then derive what can go wrong *for that specific domain*. A button has different failure surfaces than a file uploader, a Node.js job, or a multi-step wizard. Pull each failure thread until nothing is left fuzzy, then record the answers in `1-decisions.md`, one entry each, phase `grill`.

5. Before finishing, decide complexity: does implementing this safely need more than a PRD — new types/interfaces, a non-obvious file layout, a design that needs grounding against existing source before anyone builds it? If yes, set `isComplex: true`; otherwise `false`. This is about implementation risk, not ticket size — a small-sounding change to a shared abstraction can still need an architecture doc.
6. If the ticket workspace's `state.json` exists, validate it per
   `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/state-schema.md`, then update it (version 4 only): set `isComplex`,
   refresh `updatedAt`.

**Record readiness** through `docs/agents/issue-tracker.md` `## Readiness` (where the rung
lives: `${CLAUDE_PLUGIN_ROOT}/skills/to-issues/references/pipeline-block.md` § Where the rung lives): set `workspace` to the
workspace root, set `grill: done: <decisionsPath>`, and move `readiness` down one rung — to
`needs:spec`, or straight to `needs:issues` if the grilling settled the contract as well.
Record the new rung's dated reason. Follow that section exactly — a body-block tracker edits
the `## Pipeline` block; a tracker whose description must not be edited keeps the rung in
`units[].readiness`/`assessed` and mirrors labels.

**Post the grill-end comment.** One comment on `ticketRef`, through
`docs/agents/ticket-tracker.md` `## Post a comment`, listing every new `[Dn]` requirement
added to `prd.md` this run (plus any open `⚠ Dn` question). Skip it when there are none or
`ticketRef` is `null`. **Never edit the ticket's description** — product owns that text.


With a workspace, steps 3 and 5 always apply — write `1-decisions.md` and update `state.json` as you go. Without one, only the decisions log is written.

7. **Commit.** Join the writer (and any `/domain-modeling` writers), then make one commit for
   this stage's artifacts, staged by path — `1-decisions.md`, `prd.md`, `state.json`, the capability-log
   row, and any ADR/glossary files `/domain-modeling` wrote. Never `-A`. Commit per
   `${CLAUDE_PLUGIN_ROOT}/contracts/commit.md`: type `docs`, subject `record <slug> decisions`,
   issue = the source item (none if there is none yet). Do not push — `/ship` does,
   after `/to-issues`.

8. `/to-spec` has `disable-model-invocation: true` — it cannot be launched programmatically from here, only typed by the user. Reference whatever grounds the synthesis: name the workspace's `decisionsPath` (and `ticketRef`, if set). Then end your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /to-spec <ticket-id-or-slug>
```
