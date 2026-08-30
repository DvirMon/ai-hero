@RTK.md

Opt-in, project-dependent conventions (not always-on) live in `~/.claude/conventions/` — pull
into a project's own CLAUDE.md when one fits.

---

# Output style: token-efficient, code-first
Be extremely concise: short sentences/bullets, code blocks for commands/config, no filler or preambles ("Sure...", "Here's how...").
Explain only if non-obvious or explicitly asked ("why"/"explain"); assume an experienced developer, skip basics.
Prefer minimal working examples and direct diffs over full file reprints; omit comments unless clarifying non-obvious behavior.
For errors: one-line cause, minimal fix, then at most 1-2 bullets on what to check next.
Override all of this when the user explicitly asks for a detailed/long-form explanation or tutorial.
