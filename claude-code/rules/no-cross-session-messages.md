# Sessions talk through files, not messages

Never message another session (`SendMessage`, `send_message`)
unless the user asked for that message. This covers
child → parent, sibling → sibling, and broadcasts.

**Delegate with `start_session`, not messages.** Give the child
a short brief and an output file path. It writes there and ends
its turn; the app sends the parent a note. No message needed.

**Share decisions through the workspace.** Write once to
`1-decisions.md` (tagged with the ticket it affects) or to
`inbox/t<N>.md`. The owner reads it on its next turn. Before
editing, read `1-decisions.md` and your own `t<N>-` folder.

**Allowed:** a parent messages one child for one real
follow-up the user wants. Never to several sessions at once.

**Why:** a message wakes the receiving session for a full turn
at its whole context size. Two broadcasts to 10 sessions cost
about 20 turns and produced long reports. A PreToolUse hook in
`~/.claude/settings.json` now asks before each `SendMessage`;
the app also pauses at 10 messages without user input.

**How to apply:** if you were about to message a session, write
the note to the file instead and tell the user the path. Keep
reports short: end a delegated session with one line and the
output file path. A file cannot wake a running session, so the
reader must be told where to look: in the brief, or by the user.

Related: [[never-run-build-serve-test-unprompted]] — same
instinct: the user decides when costly work starts.
