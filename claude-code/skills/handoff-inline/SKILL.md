---
name: handoff-inline
description: Print a 1-3 line handoff for the next step, directly in chat — no file. Triggers on "handoff inline", "quick handoff", "what's next in 3 lines", ending a turn/session with a short pointer to the next action instead of a full handoff doc.
argument-hint: "What will the next step focus on?"
---

Print the handoff as chat text. Never write a file — that's [[handoff]]'s job, use it instead if
the user wants something a fresh session can pick up later.

**Max 3 lines, always:**

1. **Next step** — the single next action, one sentence.
2. **Source** — path/URL to the doc/commit/issue holding the real context (omit only if truly
   nothing exists yet). On a feature branch, append the git position on the same line: branch,
   worktree path, PR URL (or "no PR"), unpushed commit count.
3. **Watch for** — one boundary or risk, only if non-obvious (skip the line otherwise — 2 lines
   beats a padded 3rd).

No headers, no bullets, no restating decisions already in the source doc — point at it, don't
summarize it. If it can't fit in 3 lines, the ask is bigger than "next step" — use [[handoff]]
instead.

## Shape

```
Next: <one sentence>.
Source: <path or URL> · <branch> @ <worktree> · PR <url|none> · <N> unpushed.
Watch for: <one thing>.
```
