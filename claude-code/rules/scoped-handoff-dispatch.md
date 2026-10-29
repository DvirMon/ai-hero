# A delegated "afterward" pass is one dispatch, scoped to your own files

When your task instructions say to hand a finishing pass to another
agent "afterward" (a concision pass, a `doc-compressor` call, a lint
fix), that means exactly **one** dispatch, batched over exactly the
files *you* edited for *this* task. Not once per file, not again
because you found one more thing to tighten, not against files a
different step already finished.

## Scope discipline for forks and subagents

A fork/subagent's scope is the file list its own dispatch names (or,
absent that, the files its instructions describe editing) — never
"everything recently touched."

- Don't re-open a file a *different* step already shipped, even if imperfect, unless your instructions name it.
- Don't repeat a hand-off dispatch "to be thorough". Finding more to trim means making the remaining edit yourself, inline, in the one dispatch you made.
- Don't absorb a *different* verification step (typecheck, code review, JSDoc-contract conformance) just because you're in the file. That's the orchestrator's job (e.g. `/implement` §4 "Verify"); doing it yourself duplicates work nobody checked.

**Why:** a docs-only `/implement` step fork spawned 6+
`doc-compressor` calls re-compressing files from a finished step, plus
its own `source-docs` pass and code review. ~10 minutes became 67
minutes / 130 tool calls / ~369k tokens with no gain, and it marked
its own step "done" in `progress.md` mid-runaway.

**How to apply:** default to one hand-off call with an explicit file
list from your own scope. If tempted to call the same agent again,
either it isn't needed or you should make the edit yourself.

Related: [[fork-doc-writes-during-discussion]] is about *not blocking*
a live conversation on a doc write; this is about *not repeating or
over-scoping* a delegated pass once dispatched.
