---
name: concise-docs
description: 'Make already-written prose SHORTER without losing information — cut filler, hedging and redundant restatement; steps, acceptance criteria, edge cases, exact identifiers and flow sequences stay intact. Defined by the WORK, not the file type — applies to Markdown docs and to code comments in any language. The policy SSOT for concision — `source-docs` and `audit-docs` both dispatch the `doc-compressor` agent, which loads this skill. Never checks whether the prose is TRUE (that is `audit-docs`) and never writes new content (that is `kipi`). Default scope is the file(s) named; everything only when explicitly asked. Edits directly, then reports a per-file line-delta plus a preserved-content check. Use when something should be "more concise", "less verbose", "tightened up", or trimmed without losing meaning.'
---

Cut words, not facts. Every edit must pass one test: does this sentence add a fact, or restate one
already stated? Only cut the latter. Edits apply directly (no draft-then-ask step) — the
preserved-content check in step 4 is what stands in for a human review, so don't skip it.

## Process

### 1. Pin the scope

- User named specific file(s)/function(s) → that's the scope, exactly.
- User said "all docs" / "all comments" / similar, explicitly → scope is every doc file, or every
  comment block, in the project (or the directory they named).
- Anything else ("clean up the docs" with no scope word) — ask which file(s), per
  `ask-dont-search-on-ambiguity`. Don't guess "all docs" from a vague ask.

### 2. Classify each block: procedural vs. explanatory

Read the full target first — compressing from an excerpt risks cutting a fact that's restated
(and therefore looks redundant) only because you haven't seen where it's actually load-bearing.

Detect mode from **structure**, not filename or doc type label:

- **Procedural** (preserve-heavy): numbered/ordered lists, Given/When/Then, "Step N", user
  flows, acceptance criteria, code blocks interleaved with prose, anything sequence-dependent
  ("first X, then Y, only after Z").
- **Explanatory** (compress-heavy): prose paragraphs with no ordinal structure — rationale,
  background, restated summaries, narrative "why we did X".

Code comments: a comment explaining *why* (a non-obvious constraint, a workaround, an invariant)
is explanatory — compress the wording, keep the fact. A comment that's actually numbering steps
in a sequence (rare, but happens in setup/migration scripts) is procedural — treat it as such.

### 3. Compress

**Cut:**
- Hedging/filler: "it's worth noting that", "in order to", "basically", "simply", "just",
  "clearly", "very".
- Sentences restating what a heading, code signature, link text, or table already says.
- The same fact repeated across multiple paragraphs — keep one statement, link/reference it from
  elsewhere instead of repeating it.
- Multi-sentence explanation where a table or bullet list already carries the same facts —
  collapse to the list, drop the prose.
- Adjective/adverb padding that adds no fact.

**A cut only counts if it removes a whole clause, sentence, or repeated
fact.** A single filler word or synonym swap, with nothing else cuttable in
its sentence, is not a compression — it's noise. If a pass through a file
turns up nothing but single-word deletions or word-for-word substitutions
(no clause/sentence/repeated-fact removed anywhere), the file is already
tight: change nothing and report "already tight, no change" per step 5. Do
not apply the one-word edit just to have something to report.

**Never cut:**
- Any numbered/ordered step in a procedure — step count before and after must match.
- Any distinct acceptance criterion or edge case — never merge two into one line to save a line.
- Exact identifiers verbatim — function/prop/flag names, error strings, status values, file
  paths. No paraphrasing these.
- Sequence-dependent flow text — collapsing "first X, then Y" into an unordered bullet list is a
  defect (lost ordering), not a compression.
- The one rationale sentence naming *why* something exists, when that "why" isn't derivable by
  reading the code/config itself (see `terse-jsdoc-for-ai-and-humans.md` — same principle, applied
  here to longer docs, not just docstrings).

### 4. Preserved-content check (the safety net, do not skip)

Before finalizing edits to a file, count against the original:
- Number of numbered/ordered steps.
- Number of distinct acceptance criteria / edge cases (bullet items in those sections).
- Every exact identifier that appeared (spot-check, not exhaustive re-typing).

If any count dropped, that's an over-cut — restore the missing item before moving on. This
replaces a human review step, so treat a mismatch as a hard stop, not a note for later.

### 5. Apply and report

Edit the file(s) directly. Report per file:

```
<file>: <before-lines> → <after-lines> lines (-N%)
Preserved: <X> steps, <Y> criteria, 0 dropped
```

A "0%" or near-0% result must mean **no edit was applied** — never a
single-word edit dressed up as a line-count delta. If the only thing you
found was one word here or there, that's the "already tight" outcome from
step 4/the materiality rule above, not a 0%-delta edit.

Don't touch files the user didn't name, even if they're linked from a target file — cross-file
scope only on explicit request, same as `audit-docs`.

## Recurrence

This skill runs once per invocation, no built-in schedule. For continuous verbosity watch on a
fast-growing doc, pair with the `loop` skill (e.g. `/loop 1d concise-docs libs/foo/docs/bar.md`)
rather than building polling into this skill.
