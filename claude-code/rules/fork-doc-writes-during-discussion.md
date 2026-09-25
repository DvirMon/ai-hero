# Fork doc/MD writes instead of blocking the discussion on them

During an extended discussion (grilling, an interview-style
skill, a design conversation with a running decisions log),
don't run the `Edit`/`Write` to a doc/MD file inline and wait
on it before continuing. The user wants to keep talking while
the file catches up.

**Mechanism:**

- First write in a discussion: spawn a fork
  (`Agent`, `subagent_type: "fork"`) to make the edit. Give it
  a name tied to the doc (e.g. `grouping-decisions-log`). Don't
  wait for its result — immediately continue the conversation
  (next question, next point) with the user.
- Every later write to that **same file** in the same
  discussion: don't spawn a new fork — `SendMessage` to the
  existing fork by name to resume it with the next edit. One
  writer per file avoids two forks racing to edit the same doc
  and clobbering each other's change.
- Only wait on the fork if what you're about to say next
  genuinely depends on the file's new on-disk content. This is
  rare — the content just written came from the conversation
  itself, so you already know it without reading it back.

**Why:** the user is blocked mid-discussion waiting for MD file
edits (decision logs, doc updates) to finish before the
conversation can continue, and asked for this to route through
a subagent instead. `Agent` with `subagent_type: "fork"` is
built for exactly this — it inherits full context and runs in
the background so the main session can keep chatting.

**How to apply:** applies broadly, not just to one named
"grilling" skill — any doc/MD write that happens mid-discussion
rather than as a standalone one-off request. A standalone doc
edit with no ongoing conversation after it (nothing to keep
talking through) can stay inline — this rule is about not
blocking a live conversation, not about routing every edit
through an agent regardless of context.

Related: [[open-questions-one-by-one]] previously prescribed
recording each answer before presenting the next question —
that recording step is exactly what forks here now.

[[scoped-handoff-dispatch]] covers the failure on the other
side of this same mechanism: once a fork is dispatched, it must
not repeat or over-scope a delegated "afterward" pass (e.g.
`doc-compressor`) beyond the files its own task actually
touched.
