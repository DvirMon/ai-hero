# Ticket decisions

`<workspaceRoot>/1-decisions.md` — one per ticket, path in `state.json`'s `decisionsPath`.
Every stage appends to it, from the first grill to the last review.

**It holds every outcome of the conversation with the agent** — while designing, and later
while challenging its code or approach. Three kinds, each one line:

| Kind | Example |
|---|---|
| Trade-off — X over Y | degrade to root over throw: one bad record must not blank the table |
| How-to — a way of doing it was agreed | `parentId` returning `null` means root |
| Feedback — a challenge changed the agent's work | review: dropped the per-row `try` — catch once per stage |

It holds the outcome, never the conversation, and never the full design.

## What goes where

| Kind | File |
|---|---|
| Outcomes of the conversation (above) | `1-decisions.md` |
| High-level architecture — types, contracts, file layout | `3-architecture.md` |
| UI / visual design | `design.md` — written in `/to-spec` by a wired design skill (e.g. `figma:design-reference`) |
| Behavior and edge-case rules | `2-spec.md` |
| Proof — benchmarks, research, comparisons | `research-*.md` / discovery files |
| Domain terms | `CONTEXT.md` |

**The test:** did the conversation settle or change it? Then it is an entry. A detail that
only follows from an entry (exact types, file layout, visual spec) goes to the file that
holds the result, and the entry is enough.

## Shape

    # <slug> — decisions

    Ticket: <link>. Capability log: <link>.

    ## Aspects

    | Aspect | Hand-off team | Status |
    |---|---|---|
    | <aspect> | <team> | open · locked MM-DD · reopened |

    ### <aspect>
    - [ ] <open gap>

    ## Ranking

    <nodes and order>

    ## Decisions

    - **D1** `MM-DD · grill` — <X> over <Y>: <why, one clause>. [proof](link) → TR12
    - **D2** `MM-DD · grill` — <how it is done>: <why, one clause>.
    - **D3** `MM-DD · review` — <what changed> after <the challenge>: <why, one clause>.

    ## Open

    - <question> — blocked on <what>

One entry = one line. Two at most. The tail is optional:
- `[proof](link)` when evidence exists.
- `→ <row id / ADR-NNNN>` when the decision was promoted.

A decision that needs a paragraph to justify it gets a research or discovery file. The entry
links to it.

**Phases:** `grill` · `spec` · `tasks` · `implement` · `review`. A `review` decision binds
exactly like a `grill` one. (`implement` is both the phase name and the skill.)

**Optional sections**, both written by `grill-with-docs`:
- `## Aspects` — when the grill splits the ticket by hand-off aspect (its step 0b). Status is
  `open`, `locked MM-DD` or `reopened`; each aspect's open gaps are a `- [ ]` checklist under
  it. This is the one status allowed in this file, because lock state is a grill output. Work
  status still never goes here.
- `## Ranking` — when the grill decomposed the ticket. Nodes and order only.

## Rules

1. **Write it when it settles**, not at the end of the stage.
2. **Own `D`-numbers.** Next free number. Never renumber, never reuse.
3. **Supersede forward, never delete.** Append ` — superseded by D<n>` to the old line. The
   new line says `replaces D<m>`.
4. **Promote what outlives the ticket.**
   - Binds one capability → a row in `docs/decisions/<capability>.md` (`decisions-log.md`).
   - Binds more than one capability → an ADR (`/domain-modeling`).
   - The entry's `→` tail names the row or the ADR.
5. **One file per ticket.** Never a `decisions.md` inside `tasks/`. The step's
   `progress.md` links to the `D`-number.

## Never in this file

- The conversation, or a summary of it.
- The full design — types, layout, visuals go to architecture, design or spec.
- Proof itself — link to it.
- Work status — that is `progress.md` and the issue's Pipeline block.

## Reading it

Read it, and the capability log, before any stage starts. Never ask again about something an
entry already settled. Reversing one is a new entry.
