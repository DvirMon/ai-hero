# Plain wording, short lines

Two rules about how output reads to this user.

## Plain wording for actions

Use an ordinary verb for the action. "Cut the selection issues" meant
"create GitHub issues from the spec"; same for "drill a spec", "land
a change" when a plain verb exists.

**Why:** the user works in English as a second language and reads
fast. Insider shorthand costs a round-trip to decode and hid the
actual proposal.

**How to apply:** name the concrete action — create/write/open an
issue, rename, delete, run. Keep precise technical terms
(`onRowsRemoved`, `computed()`, ADR numbers) exact; the rule is about
slang for actions, not technical vocabulary.

## Code shapes too, not just actions

Describe how code is *arranged* in plain words: "written as its own
variable" vs "written inside the call", "declared once and shared",
"passed in from outside". Never "hoisted" — it collides with JS
hoisting and cost two round-trips. A term with a well-known meaning
elsewhere in the language is disqualified even when standard in the
niche sense. Identifiers, type names and ADR numbers stay verbatim.

## Short lines, ~60-70 chars

Keep lines roughly 60 characters, never past ~80, in shell commands
(Bash/PowerShell) **and** chat prose, including recaps and bullets.

**Why:** the CLI soft-wraps long lines into unreadable blocks (wide
`cd && npx tsc … | grep … | head` chains, multi-hundred-line
heredocs, full-width recap paragraphs).

**Commands:**
- Split with `\` continuations, one pipeline stage per line.
- `cd` once in its own call; the working directory persists.
- Drop decorative `echo "=== header ==="` separators.
- Don't chain unrelated steps with `&&` to save a call.
- A script longer than a few lines goes in a scratchpad file, run by path.
- Prefer a relative path once the working directory is right.

**Prose:**
- Hard-wrap at ~60-70 chars; don't rely on the terminal.
- One clause per line beats one paragraph per point.
- Short labelled blocks over long flowing sentences.
