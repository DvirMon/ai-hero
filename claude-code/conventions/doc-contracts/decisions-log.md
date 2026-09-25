# Capability decisions log

`docs/decisions/<capability>.md` — one per capability, permanent, appended as decisions land.

A capability's history answers from **two** permanent files and nothing else:

| File | Answers |
|---|---|
| the capability's spec | what it does **today** |
| its decisions log | **why**, what was tried, what was reversed, what is still open |

Everything else — work folders, plans, grill transcripts, audits — is a *linked record*. The
log is an index over them, not a second copy of them.

## Why it exists

Without it, a capability's decisions live in one folder per effort, each numbering its own
decisions from `D1`. Three such folders means a bare "D7" denotes three different decisions
depending on which folder you are standing in, and a decision reversed in folder three still
reads as current in folder one. Nothing tells a reader which is which, so the only safe move is
reading all of them — which is what the log exists to make unnecessary.

## Shape

    ---
    title: <Capability> — decision history
    type: decisions-log
    capability: <capability>
    ---

    # <Capability> — decision history

    **Read this before changing anything about <capability>.** <Link to the spec.>

    <One paragraph: this log restates nothing; every row links to the record
    holding the rationale and the rejected alternatives. A row needing a second
    line means that line belongs in the linked record.>

    ## Source keys

    | Key | Record |
    |---|---|
    | **XX** | <link> — <what that effort was> |

    ## Decisions

    | | Decision | Date | Status | Record |
    |---|---|---|---|---|
    | X1 | <the decision, one line> | MM-DD | shipped | XX D1 |

    ## Still open

    <One bullet per open row: the id, and what has to happen to close it.>

    ## Maintaining this log

    <The four rules below.>

## The four rules

1. **Register before archiving.** A decision is registered here *before* its work folder moves
   to `archive/`. This is the rule that keeps the log true — sprawl happens precisely because
   nothing rolls up before a folder goes quiet.
2. **Own numbering, one prefix per capability.** Pick a short prefix unique within the project
   and state it in the header. Never reuse a source folder's `D`-number as the row id; keep the
   source `D`-number in the **Record** column so older cross-references still resolve.
3. **Never renumber, never reuse.** Append with the next free number.
4. **Supersede forward, never delete.** A reversed decision keeps its row; its **Status** cell
   is edited to name the row that replaced it (`superseded by X32`). Partial reversal says which
   half (`shipped · call-order half reversed by X33`). The history is the point — a deleted row
   is a decision someone will take again.

## Status vocabulary

`shipped` · `standing` (a constraint, never "done") · `open` · `superseded by XN` · `accepted,
not built`. Compose with `·` when a row is partly reversed or later reaffirmed.

## `adr/` vs `decisions/`

`adr/` holds **cross-capability** architectural constraints — one file per decision, reached by
any capability. `decisions/<capability>.md` is a **per-capability index**, including over the
ADRs that constrain it. A log row may cite an ADR; it never restates one, and a decision that
binds more than one capability is an ADR with a log row pointing at it, not a log entry.

## Never in a log

Rationale, alternatives weighed, counter-arguments, code snippets, status of the *work* (as
opposed to the decision), anything a row's linked record already holds. If a row tempts you to
add a sentence, the sentence belongs in the record and the link is the fix.

## Reading it

Any question about a capability — "what's the state of X", "can I change Y", "why is Z shaped
this way" — starts at the log, then the spec. A work folder is opened only for the full
rationale behind one named row. **A work folder's own `status:` or `state.json` is never proof
that something shipped**; both go stale silently. Check the source and the git history.
