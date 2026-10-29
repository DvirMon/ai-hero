# Fork doc/MD writes instead of blocking the discussion on them

During an extended discussion (grilling, an interview-style skill, a
design conversation with a running decisions log), don't run
`Edit`/`Write` on a doc/MD file inline and wait on it. The user wants
to keep talking while the file catches up.

**Mechanism:**

- First write in a discussion: spawn a fork (`Agent`,
  `subagent_type: "fork"`), named for the doc (e.g.
  `grouping-decisions-log`). Don't wait — continue the conversation.
- Later writes to the **same file**: don't spawn a new fork —
  `SendMessage` the existing one by name. One writer per file avoids
  races.
- Wait on the fork only if what you say next depends on the file's new
  on-disk content. Rare — the content came from the conversation.

**Why:** the user was blocked mid-discussion waiting for MD edits
(decision logs, doc updates); a fork inherits context and runs in the
background.

**Standalone steps too:** a multi-file doc step (decisions log, ADRs,
feature docs, story `.mdx`, `issue-graph.md`/`state.json` tracking,
`llms.txt` regen) in a skill such as `/implement` or `/ship` also
goes to a fork, never inline in the dispatcher. Use a narrower
specialist when the step is exactly its scope (`adr-writer`,
`domain-docs-writer`). Wait for the fork only when the next report
text depends on what it wrote. Check any skill with a multi-file doc
step for this gap. JSDoc (`source-docs`) is not covered; ask first.

**How to apply:** any doc/MD write mid-discussion, not just one named
"grilling" skill. A standalone one-off doc edit with nothing to keep
talking through can stay inline — the rule is about not blocking a
live conversation.

Related: [[open-questions-one-by-one]] — recording each answer is
exactly what forks here. [[scoped-handoff-dispatch]] covers the other
side: a dispatched fork must not repeat or over-scope a delegated
"afterward" pass (e.g. `doc-compressor`).
