# Route discovery work to the `discovery` agent

When the ask is **discovery** — survey what exists, compare
candidates, find how others solved this, investigate an
idea/architecture/design question — dispatch the `discovery` agent
instead of working inline. This rule is the standing authorization to
use the Agent tool for that class of work.

**What counts as discovery**

- "research X", "investigate X", "compare A vs B", "what are the options for X"
- "how do enterprise codebases / other libraries handle X"
- Evaluating a dependency against requirements before adopting it
- Surveying prior art before an architecture or API decision

**What does not**

- A concrete fact cheap to verify in one lookup (grep, read, `npm view`) — just do it ([[ask-dont-search-on-ambiguity]]).
- A judgment call about direction or preference — ask the user.
- Work a phase-specific agent owns: `kipi-discovery`; with the `design-system` plugin, `ds-discovery`, `ds-figma-discovery`, `ds-codebase-discovery`, `ds-a11y-discovery`.
- **Product/UX questions** (what people struggle with, what a competing product lets a person do, whether this repo covers a use case) — the `story:discovery` agent via `/story:discovery`. The split is the question: `discovery` asks *how should this be built*, `story:discovery` asks *what does a person need and what hurts today*.
- Anything inside a skill that prescribes its own discovery step.

**How to dispatch**

Pass `question`, `outputPath`, and any stated `constraints`. Pick
`outputPath` by the domain that owns the question, per
[[file-organization]]; default `docs/discovery/<slug>.md` only when
none owns it. Independent questions dispatch in parallel, one agent
each — map edges first per [[decompose-by-dependency-graph]] and
sequence only genuinely dependent ones. `outputPath` ends in `.md`:
one Markdown file unless it outgrew one.

**Findings go to the file, chat gets the pointer.** Relay the agent's
summary, not its findings. Every claim carries a source tag; anything
uncited is listed as unverified.

This holds for **any** audit (competitive feature audit, codebase
audit, doc audit). The user: dumping a large result into chat
"pollutes" the session. Write one consolidated Markdown doc to disk,
publish it as an Artifact too when it benefits from a shareable page,
and give chat only a short pointer plus the path — never the tables
or body. Normal terse Q&A answers are unaffected.

**Terminology: discovery, not research.** Name the agent, files and
commands accordingly.
