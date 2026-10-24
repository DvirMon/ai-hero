# Route discovery work to the `discovery` agent

When the ask is **discovery** — survey what exists, compare candidates, find how others solved
this, investigate an idea/architecture/design question — dispatch the `discovery` agent instead
of doing it inline. This rule is the standing authorization to use the Agent tool for that class
of work; no per-request confirmation needed.

**What counts as discovery**

- "research X", "investigate X", "compare A vs B", "what are the options for X"
- "how do enterprise codebases / other libraries handle X"
- Evaluating a dependency against requirements before adopting it
- Surveying prior art before an architecture or API decision

**What does not**

- A concrete fact cheap to verify in one lookup — grep, read, `npm view`. Just do it.
  (Same line as [[ask-dont-search-on-ambiguity]] draws.)
- A judgment call about direction or preference — ask the user, don't dispatch an agent to
  guess.
- Work a phase-specific agent already owns: `kipi-discovery` globally; with the
  `design-system` plugin enabled, also `ds-discovery`, `ds-figma-discovery`,
  `ds-codebase-discovery`, `ds-a11y-discovery`. Those win in their phase.
- **Product/UX questions** — what people struggle with, what a person can click and press in a
  competing product, whether this repo already covers a use case. Those belong to the
  `prd-discovery` agent, dispatched by the `prd-discovery` skill. The split is the question,
  not the topic: `discovery` asks *how should this be built*, `prd-discovery` asks *what does a
  person need and what hurts today*.
- Anything inside a skill that already prescribes its own discovery step.

**How to dispatch**

Pass `question`, `outputPath`, and any stated `constraints`. Pick `outputPath` by the domain that
owns the question — a domain's docs live with the domain, per [[file-organization]]. Default to
`docs/discovery/<slug>.md` only when no domain owns it.

Multiple independent discovery questions dispatch in parallel, one agent each — map the edges
first per [[decompose-by-dependency-graph]], and only sequence the ones that genuinely depend on
an earlier answer.

`outputPath` ends in `.md` — output is always Markdown, one file unless it has outgrown one.

**Findings go to the file, chat gets the pointer.** Relay the agent's summary, not its findings.
Every claim in that file carries a source tag; anything uncited is listed as unverified instead.

This holds for **any** audit, not only an agent's output — a competitive feature audit, a
codebase audit, a doc audit. The user's words: dumping a large result into chat "pollutes" the
session; "from now on, whenever I ask you to go and audit the research". So: write one
consolidated Markdown doc to disk, publish it as an Artifact too when it benefits from a
shareable page, and give chat only a short pointer plus the path — never the tables or the body.
It does not block normal terse Q&A answers.

**Terminology: discovery, not research.** Name the agent, the files, and the commands
accordingly — the user's word for this is discovery.
