# Plain wording, short lines

Two rules about how output reads to this user.

## Plain wording for actions

Use an ordinary verb for the action. The user asked twice what
"cut the selection issues" meant; it means "create GitHub
issues from the spec". Same for similar shorthand ("drill a
spec", "land a change") when a plain verb exists.

**Why:** the user works in English as a second language and
reads fast. Insider shorthand costs a full round-trip to
decode, and it hid the actual proposal — creating issues —
behind a word that carried no meaning for them.

**How to apply:** name the concrete action plainly —
create/write/open an issue, rename, delete, run. Keep precise
technical terms (`onRowsRemoved`, `computed()`, ADR numbers)
exact. The rule is about slang for actions, not about
technical vocabulary.

## Short lines, ~60-70 chars

Keep lines short everywhere the user reads them — roughly 60
characters, never past ~80. Applies to shell commands run
through Bash/PowerShell **and** to chat prose, including
recaps, explanations and bullet lists.

**Why:** first raised after a session of wide one-liners — a
long `cd && npx tsc … | grep … | head` chain plus
multi-hundred-line heredocs. Extended to prose after a recap
written in full-width paragraphs. The CLI soft-wraps long
lines into unreadable blocks either way.

**Commands:**
- Split with `\` continuations, one pipeline stage per line.
- `cd` once in its own call; the working directory persists.
- Drop decorative `echo "=== header ==="` separators.
- Don't chain unrelated steps with `&&` to save a call.
- A script longer than a few lines goes in a scratchpad file,
  run by path.
- Prefer a relative path once the working directory is right.

**Prose:**
- Hard-wrap at ~60-70 chars. Don't rely on the terminal.
- One clause per line beats one paragraph per point.
- Short labelled blocks over long flowing sentences.
