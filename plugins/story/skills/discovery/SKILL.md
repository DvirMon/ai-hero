---
name: discovery
description: >
  Product discovery for a feature — community pain, peer capabilities, product UX and internal
  coverage, run as parallel `story:discovery` agents — then writes the feature's PRD (user
  stories, failure behavior, coverage marks, gaps split by layer) in the PM voice, plus the
  peer-capability inventory `/story:plan` requires. Use when asked for a PRD, product doc or user
  stories; "make sure we cover all the use cases"; "what features did we miss"; or "the product
  pass" on something already designed. First stage after `/story:setup`; hands off to
  `/story:plan`.
---

# Product discovery

Engineering derives API from this document, not the reverse. A feature specced from the API
outward covers what the API made easy. A feature specced from a person's needs inward exposes
what the API forgot.

Run it **while exploring a feature** — once enough design exists to know roughly what the
feature is, before or alongside the spec. After the spec still pays; the deltas land as spec
changes instead of spec inputs.

## Config

Resolve `.claude/story.json` per `${CLAUDE_PLUGIN_ROOT}/contracts/story-config.md` — three
layers, merged, defaults applied — for the project the feature's path matches. No `story.json`
→ run `/story:setup` first. Misconfig stops with the key, path or skill named.

| Value | Used for |
|---|---|
| `{domainDir}` | the domain the feature belongs to; `{component}`-style placeholder → fill from the user's target, ask once if unresolvable |
| `{prd}` (`paths.prd`) | where the PRD is written |
| `sources.anchors` + `sources.anchorsFile` | anchor sections to seed peers and source classes from |
| `sources.packages` | the peer set N2 compares against |
| `sources.internal` | the globs N4 audits |
| `paths.host` | the files N4 reads to judge real story coverage |
| `skills.discovery` | load each before dispatching anything |

Agents never resolve the config. Pass each one the rendered values it needs.

**Empty `sources` is valid.** Discovery runs fully open: each agent picks the dominant peers
itself, says which and why, and proposes an anchors section. Relay the proposal to the user in
the report — never write to the anchors file yourself.

## What this produces

| File | Path | Read by |
|---|---|---|
| PRD | `{prd}` | `/story:plan`, sdlc stages |
| Peer-capability inventory | `{domainDir}/docs/discovery/peer-capabilities.md` | `/story:plan` (**required input**), `/story:create` |
| Community pain | `{domainDir}/docs/discovery/community-pain.md` | `/story:plan` (failure paths) |
| Product UX | `{domainDir}/docs/discovery/product-ux.md` | `/story:plan`, when run |
| Internal coverage | `{domainDir}/docs/discovery/internal-coverage.md` | `/story:plan` (corrects coverage marks) |

The PRD is a numbered list of user stories, each with acceptance criteria, failure behavior and
an honest coverage mark, plus a cross-feature section, open questions, and a gap analysis
**split by owning layer** (phase 4). It is not a design doc, not an API sketch, and not a peer
survey — those are its inputs, and they live in their own files.

The inventory is **not** optional colour. It is the only source that says what a person
actually clicks in a shipped implementation; without it `/story:plan` invents affordances.
Overwriting an existing discovery file → reference the old one by date in the new file's header.

## The five phases

### 1. Find the house template — do not invent a shape

The PRD's shape is the **capability variant** of `${CLAUDE_PLUGIN_ROOT}/contracts/prd.md`; that
contract wins where this sketch differs. Discovery-derived lines take no source tag; a line
copied from a remote ticket or a grill decision keeps its `[PROJ-123 · MM-DD]` / `[Dn]` tag.

Look for an existing PRD in the repo before writing. Match its structure exactly: section
numbering, coverage-mark legend, story format, which blocks each story carries, how open
questions are recorded. If none exists, this default holds:

```
Title, frontmatter with a status line naming what's resolved and what genuinely remains
Scope — what the feature means to a person, including modes if it has genuinely different ones
Coverage marks — the legend (✅ covered / 🟡 partly / ❌ not), and what "covered" means
  ("demonstrable today, with the failure path included" — not "the function exists")
# N. <Capability area>            ← ordered by how badly the person is hurt if it's missing
## N.M — <what the person achieves> (mode) — <coverage mark>
  > As someone <situation>, I want <outcome>, <so that / without>.
  **Acceptance criteria** — observable, on-screen, testable
  **Failure behavior** — what happens when it goes wrong; every story has one
  **Mode note** — only when modes genuinely differ; say which difference is sharpest
  **Coverage** — cite the actual story/demo file, and say what's still missing
# Cross-feature interactions      ← each story filed under the feature that must CHANGE
# Open questions                  ← each with a recommendation and what would settle it
# Not user-facing                 ← real problems that are the integrator's, not the person's
```

Two rules that hold regardless of house shape:

- **Coverage is not a scope limit.** The uncovered stories are the point of the document.
- **A cross-feature story belongs to the feature that has to change**, not the one you're
  writing about. When two features collide, the story lives with whichever must change its
  behavior to resolve it.

### 2. Map the graph, then dispatch in parallel

List the nodes, map the edges between them, rank. The standard shape is four independent
discovery nodes feeding one dependent writing node:

```
N1 community pain      ─┐
N2 peer capabilities   ─┤
N3 product UX          ─┼─→ N5 write the PRD (you, in the PM role)
N4 internal coverage   ─┘
```

N1–N4 are parallel-safe — dispatch them in **one message, multiple tool calls**.

**Dispatch the `story:discovery` agent** once per node:

| Input | Value |
|---|---|
| `mode` | `community-pain` · `peer-capabilities` · `product-ux` · `internal-coverage` |
| `feature` | the feature, in the user's words |
| `outputPath` | the node's file from § What this produces |
| `peers` | N1/N2: `sources.packages`; N3: the end-user products, if the anchors name any. Empty → the agent picks |
| `anchors` | `sources.anchors` + the resolved `sources.anchorsFile` path |
| `internal` | N4: `sources.internal` rendered, plus the `paths.host` glob and `{prd}` |

The agent carries the source-reliability rules, citation rules and output shape — give it the
question and the constraints, not the method. The per-node briefs below are the contract it
already knows; don't re-paste them.

Say it in the prompt even though the agent's own prompt forbids it: **do not spawn subagents.**
A four-peer survey otherwise fans out one agent per peer, past what the user agreed to.

Each agent writes to its file; chat gets a three-line pointer.

**N1 — community pain.** Issue trackers, forums, blog posts for the dominant peers. Themes, not
a link dump. Ask for: recurring complaints with issue numbers and recency; **feature requests
that keep resurfacing and stay closed-as-wontfix** (the highest-value signal — a need the
category has not met); end-user complaints as distinct from integrator complaints; collisions
with other features. Every claim from a fetched page, cited by URL. "Unverified" said out loud.

**N2 — peer capabilities, user-facing only.** What a person can *click and press*, not what
config key exists. The valuable output is not the matrix but the **section per axis naming where
the peers disagree** — disagreement is where a product decision lives. Tier splits matter (free
vs. paid): a capability behind a paywall is evidence of what people pay for. This file is the
inventory `/story:plan` requires.

**N3 — product UX.** Shipped end-user products whose UI contains this feature — what a person
clicks and sees, not what an integrator configures. The signal is the **everyday expectation**
set by the most widely used products, plus plan-gating. Sources: the product's own help center,
docs, release notes or official forum, each with a **read date**. Optional per run — dispatch it
when the question is a behavior a person meets in tools they already use; skip it for
integrator-only questions.

**N4 — internal coverage.** Read-only. Ask for: every settled decision in one line, tagged
**product-visible** or **internal-only**; anything an older doc still states that newer
decisions contradict; **every place a story for this feature is already written elsewhere**
(other features' cross-feature sections — linked, never rewritten); what shipped code gives the
feature for free and what it does not; real story coverage, read from the `paths.host` files'
code rather than names or `.mdx` wrappers, because names drift.

### 3. Write it in the PM voice

Take the role deliberately. The failure mode is an engineering doc with "As someone…" pasted on
top.

- **A story is a person's outcome, not a mechanism.** "I want to see my correction stick without
  losing my place in the list" — not "I want the store to expose a patch verb."
- **Every story gets a failure path.** The missing half of a happy-path-only story is the half
  that ships broken.
- **Acceptance criteria are observable.** On screen, from the keyboard, announced. A criterion
  only checkable by reading source belongs in "Not user-facing".
- **Order by harm.** Within each area, the story that hurts most when missing goes first.
- **Name what cannot be met.** When a criterion is unreachable under another active feature, say
  so in the story instead of quietly weakening the criterion.
- **Open questions carry a recommendation and what would settle them.** Never bare, never
  silently picked.
- **"Not user-facing" is load-bearing.** Listing the integrator's real problems there stops them
  being mistaken for missing stories.

Write coverage marks from N4's evidence, not optimism. Marks drift in **both** directions —
under-crediting shipped work is as common as over-crediting it.

### 4. Split every gap by the layer that owes the fix

**The stories stay layer-free. The gaps do not.** A person does not perceive layers, so a story
naming one is in the wrong voice. A gap is work someone has to do, and the first question about
work is who does it. Two gaps that read alike in a story can land in different places:

| Gap | Layer | Why |
|---|---|---|
| "no value is derived for X" | **state** | nothing computes it; no template can show what does not exist |
| "there is no control to change X" | **UI** | the state verb exists and is settled; nothing renders a control that calls it |

Wrong in the cheap direction files a UI gap against the state spec, where it sits unactionable.
Wrong in the expensive direction ships a control with no state behind it.

Tag each gap **state**, **UI**, or **both** — and for both, say what each layer owes. "Both"
usually means the state half is a signal the UI half cannot be built without. The recurring
shape: a control that cannot label itself. A select-all checkbox is trivial to render and
impossible to render *correctly* without an "is everything selected" signal from state.

- **At least two sections.** Never one undifferentiated gap list, even when one side has a
  single entry — a near-empty half is itself the finding, usually the UI half, because
  affordances get specced last.
- **Separate files only when a layer's list stands alone**, and only if the project already
  splits its docs that way. Stories are never duplicated across the split — they live once, in
  the PRD, in the person's voice.

Where the project layers its docs, name the owning file per gap, not just the layer.

### 5. Report the deltas, then hand off

Name plainly, each tagged with its layer:

- Stories with **no corresponding decision** in the engineering record — the missed features.
- Stories the settled design **cannot satisfy** as decided — a decision to reopen, said
  explicitly.
- **Capabilities with no owner at all** — a missing *feature*, not a missing paragraph; no single
  spec read finds it. Check against the project's own feature registry (status table, doc index,
  public barrel), and say which registry you checked.
- Proposed anchors sections from the agents, when `sources` was empty or a node broadened.
- New open questions — ask them one at a time, never as a list.

Then hand off: **`/story:plan`** reads `{prd}` and `{domainDir}/docs/discovery/peer-capabilities.md`
and re-derives the coverage marks against real story code. If the feature is also being specced
elsewhere, say the spec now has a delta to absorb — two documents written from opposite ends
disagree, and implementation time is the expensive place to find out.

## Pitfalls

- **Writing the doc from the design.** If every story maps cleanly to a settled decision, the doc
  found nothing. Friction with the design is the deliverable.
- **Restating a story another feature owns.** Link it. The unmaintained copy is the one read.
- **Marking covered because the function exists.** Covered means a person can see it happen,
  failure path included.
- **Letting agents multiply.** One agent per node, no subagents, stated in the prompt.
- **Skipping N4 because "we know our own code".** N4 keeps the doc honest; its absence shows up
  as a doc contradicting a settled decision.
- **Skipping N2.** `/story:plan` stops without the inventory.
- **One flat gap list.** UI gaps filed against the state spec never get actioned.
- **Tagging a story with a layer.** The split belongs on gaps.
- **Missing a gap because no spec owns it.** Reading specs finds gaps *within* features; only the
  registry check finds a missing feature.
