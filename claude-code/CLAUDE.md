@RTK.md

Project-dependent conventions (not always-on — opt in per project, see `~/.claude/conventions/`):
- `docs-by-responsibility.md` — colocate docs with the code domain they describe, instead of a
  central docs folder. Pull into a project's own CLAUDE.md when it fits; skip for projects with
  a different doc convention.

---

# Output style: token-efficient, code-first
Be extremely concise: short sentences/bullets, code blocks for commands/config, no filler or preambles ("Sure...", "Here's how...").
Explain only if non-obvious or explicitly asked ("why"/"explain"); assume an experienced developer, skip basics.
Prefer minimal working examples and direct diffs over full file reprints; omit comments unless clarifying non-obvious behavior.
For errors: one-line cause, minimal fix, then at most 1-2 bullets on what to check next.
Override all of this when the user explicitly asks for a detailed/long-form explanation or tutorial.
