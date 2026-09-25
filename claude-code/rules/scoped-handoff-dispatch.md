# A delegated "afterward" pass is one dispatch, scoped to your own files

When your own task instructions say to hand a finishing pass to another agent "afterward" — a
concision pass, a `doc-compressor` call, a lint fix, any single named touch-up — that means
exactly **one** dispatch, batched over exactly the files *you yourself* just edited for *this*
task. It does not mean: dispatch it once per file, dispatch it again because you found one more
thing to tighten, or dispatch it against files a different step already finished.

## Scope discipline for forks and subagents

A fork or subagent's working scope is the file list its own dispatch names (or, absent that, the
files its own instructions describe editing) — never "everything in the repo I can currently see
was recently touched." Concretely:

- Don't re-open or re-touch a file a *different* step/task already shipped, even if it looks
  slightly imperfect, unless your own instructions explicitly named it.
- Don't repeat a hand-off dispatch (e.g. to `doc-compressor`) more than once per task, "to be
  thorough" or because a later pass of your own reasoning found one more line to trim. If you
  keep finding more, that's a signal to make the remaining edit yourself, inline, in the one
  dispatch you already made — not to spawn another agent.
- Don't silently absorb a *different* verification step (typecheck, code review, JSDoc-contract
  conformance) into your own task just because you happen to be sitting in the file at the time.
  That's the orchestrating session's job (see e.g. `/implement`'s own §4 "Verify"), and doing it
  yourself duplicates work and produces a result the orchestrator never asked for or checked.

**Why:** a docs-only `/implement` step (10 numbered items: decisions logs, ADR amendments,
CLAUDE.md, an issue body, `llms.txt`) was dispatched as a fork. Instead of one batched hand-off,
it spawned at least 6 separate `doc-compressor` calls, all re-compressing the same 2-3 source
files from an *already-finished, different* step, and additionally ran its own `source-docs`
JSDoc pass and its own code review — neither asked for. The step ballooned from an expected
~10 minutes to 67 minutes / 130 tool calls / ~369k tokens, with zero improvement to the actual
deliverable (the docs the step was supposed to write). No data was lost, but it was pure waste,
and it briefly made the dispatching session's own progress-tracking unreliable (the fork marked
its own step "done" in `progress.md` mid-runaway, well before it actually finished).

**How to apply:** whenever you're about to dispatch — or you yourself are a fork/subagent that
was told — to hand a result to another agent "afterward," default to exactly one call, with an
explicit file list drawn only from your own task's own scope. If you're tempted to call the same
hand-off agent again, stop: either it's not actually needed, or you should just make the
remaining edit yourself.

Related: [[fork-doc-writes-during-discussion]] — that rule is about *not blocking* a live
conversation on a doc write; this one is about *not repeating or over-scoping* a delegated pass
once it's dispatched. Same family (fork discipline), different failure mode.
