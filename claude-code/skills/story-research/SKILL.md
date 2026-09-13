---
name: story-research
description: >
  Research a feature from the product side and write its user-stories doc (PRD) — what a person
  needs to be able to do, what they should experience when it goes wrong, and which scenarios the
  engineering design has not thought about yet. Runs parallel research agents (community pain,
  competitor capabilities, internal coverage) and then writes the doc in the PM voice. Use this
  when the user asks for a PRD, product doc, or user stories for a feature; says "make sure we
  cover all the use cases"; wants to find features that were missed; or asks to do "the product
  pass" on something already designed or specced. Pairs with story-plan, which consumes the doc
  this skill produces and re-derives its coverage marks against real story code.
---

# Product user-stories research

Engineering derives API from this document, not the reverse. That inversion is the whole point:
a feature specced from the API outward covers what the API happened to make easy. A feature
specced from a person's needs inward exposes what the API forgot.

Run this **while exploring a feature** — after enough design exists to know roughly what the
feature is, and before (or alongside) the spec. Running it after the spec is still worth it; it
just means the deltas it finds land as spec changes rather than spec inputs.

## What this produces

One document: a numbered list of user stories, each with acceptance criteria, failure behavior,
and an honest coverage mark. Plus a cross-feature section, open questions, and a gap analysis
**split by owning layer** (phase 4). It is not a design doc, not an API sketch, and not a
competitor survey — those are inputs to it, and they live in their own files.

## The four phases

### 1. Find the house template — do not invent a shape

Look for an existing product user-stories doc in the repo before writing anything. Match its
structure exactly: section numbering, coverage-mark legend, story format, which blocks each story
carries, how open questions are recorded.

If none exists, this is the first one, and the shape below is a reasonable default:

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

Two rules that carry regardless of house shape:

- **Coverage is not a scope limit.** The uncovered stories are the point of the document.
- **A cross-feature story belongs to the feature that has to change**, not to the feature you're
  writing about. Grouping's collision with editing is owned by whichever one must change its
  behavior to resolve it.

### 2. Map the graph, then dispatch in parallel

Per `decompose-by-dependency-graph`: list nodes, map edges, rank. The standard shape is three
independent research nodes feeding one dependent writing node.

```
N1 community pain (web)     ─┐
N2 competitor capabilities  ─┼─→ N4 write the doc (you, in the PM role)
N3 internal coverage audit  ─┘
```

N1–N3 are parallel-safe — dispatch them in **one message, multiple tool calls**. Tell each agent
explicitly: **do not spawn subagents**. An agent given a four-library survey will otherwise fan
out one agent per library and the count multiplies past what the user agreed to.

Each agent writes to a **file**, not to chat; chat gets a three-line pointer. Put research files
in whatever work folder the project uses for episodic research, alongside any engineering research
already there.

**N1 — community pain.** GitHub issues, Stack Overflow, Reddit, blog posts for the two or three
dominant libraries in this space. Organised as themes, not a link dump. Ask specifically for:
recurring complaints with issue numbers and recency; **feature requests that keep resurfacing and
stay closed-as-wontfix** (highest-value signal — that's a need the category has not met); end-user
complaints as distinct from integrator complaints; and collisions with other features. Every claim
verified from a fetched page, cited by URL. "Unverified" said out loud rather than dropped or
asserted.

**N2 — competitor capabilities, user-facing only.** What a person can *click and press*, not what
config key exists. The valuable output is not the matrix, it's the **section per axis naming where
the libraries disagree** — disagreement is exactly where a product decision lives, because it means
there was no obvious answer. Tier splits matter (free vs paid), because a capability behind a
paywall is evidence of what people will pay for.

**N3 — internal coverage audit.** Read-only. What the repo already decided, already documented,
and can already demonstrate. Ask for: every settled decision in one line each, tagged
**product-visible** or **internal-only** (a person can perceive the difference, or cannot);
anything the older reference doc still states that newer decisions contradict; **every place a
story for this feature is already written somewhere else** (other features' cross-feature sections
routinely own them — those get linked, never rewritten); what shipped code gives this feature for
free and what it does not; and real demo/story coverage, read from the host component's code rather
than its name or its `.mdx` wrapper, because names drift.

### 3. Write it in the PM voice

Take the role deliberately. The failure mode is writing an engineering doc with "As someone…"
pasted on top.

- **A story is a person's outcome, not a mechanism.** "I want to see my correction stick without
  losing my place in the list" — not "I want the store to expose a patch verb."
- **Every story gets a failure path.** A story with only a happy path is half a story, and the
  half that's missing is the half that ships broken.
- **Acceptance criteria are observable.** On screen, from the keyboard, announced. If a criterion
  can only be checked by reading source, it belongs in "Not user-facing".
- **Order by harm.** Within each area, the story that hurts most when missing goes first.
- **Name what cannot be met.** When an acceptance criterion is unreachable under some other active
  feature, say so in the story rather than quietly weakening the criterion.
- **Open questions carry a recommendation and what would settle them.** Never a bare question, and
  never silently picked.
- **"Not user-facing" is load-bearing.** Listing the integrator's real problems there is what stops
  them being mistaken for missing stories.

Write the coverage marks from N3's evidence, not from optimism. Marks drift in **both** directions
— under-crediting shipped work is as common as over-crediting it.

### 4. Split every gap by the layer that owes the fix

**The stories stay layer-free. The gaps do not.** A person does not perceive layers, so a user
story that says "which layer this belongs to" is written in the wrong voice. But a gap is a piece
of work someone has to do, and the first question about any piece of work is who does it.

Two gaps that read identically in a story can land in completely different places:

| Gap | Layer | Why |
|---|---|---|
| "no summary is computed for a group" | **state** | nothing derives the value; no template can show what does not exist |
| "there is no menu to change the grouping from" | **UI** | the state verb exists and is settled; nothing renders a control that calls it |

Get this wrong in the cheap direction and you file a UI gap against the state spec, where it sits
unactionable. Get it wrong in the expensive direction and you ship a control with no state behind
it.

Tag each gap **state**, **UI**, or **both** — and when it is both, say what each layer owes,
because "both" usually means the state half is a signal the UI half cannot be built without. The
recurring shape: a button that cannot label itself. Expand-all is trivial to render and impossible
to render *correctly* without an "is everything currently expanded" signal from the state layer.

Two structural rules:

- **At minimum, two sections.** Never one undifferentiated gap list. Split it even when one side
  has a single entry — an empty or near-empty half is itself the finding, and it is usually the UI
  half, because affordances get specced last.
- **Separate files only when a layer's list is large enough to stand alone**, and only if the
  project already separates its docs that way (a `state/` and `ui/` tree, or equivalent). One
  product doc with two clearly split gap sections beats two thin docs that both restate the same
  stories. The stories themselves are never duplicated across the split — they live once, in the
  product doc, in the person's voice.

Where the project layers its docs, name the owning file per gap, not just the layer.

### 5. Report the deltas, then hand off

The point of the exercise is what it found that the design did not have. Close by naming, plainly,
each item tagged with its layer per the split above:

- Stories with **no corresponding decision** in the engineering record — these are the missed
  features the user asked for.
- Stories the settled design **cannot satisfy** as decided — these need a decision reopened, and
  the user needs to hear that explicitly, not find it later.
- **Capabilities with no owner at all** — distinct from a missing decision. A gap that no existing
  feature doc could ever absorb is a missing *feature*, not a missing paragraph, and it will not be
  found by reading any one spec. Check the answers against the project's own feature registry
  (a status table, a doc index, a barrel file) rather than against memory of what exists, and say
  explicitly which registry you checked.
- New open questions, routed one at a time per `open-questions-one-by-one` — do not dump the list.

Then hand off: `story-plan` consumes this document and re-derives its coverage marks against real
story code. If the feature is also being specced elsewhere (another session, another branch), say
that the spec now has a delta to absorb — two documents written from opposite ends will disagree,
and finding out at implementation time is the expensive way.

## Pitfalls

- **Writing the doc from the design.** If every story maps cleanly to a decision already made, the
  doc found nothing and was not worth writing. Friction with the settled design is the deliverable.
- **Restating a story another feature already owns.** Link it. Two copies drift, and the copy that
  is not maintained is the one someone reads.
- **Marking a capability covered because the function exists.** Covered means a person can see it
  happen, failure path included.
- **Letting research agents multiply.** One agent per node, no subagents, stated in the prompt.
- **Skipping N3 because "we know our own code".** N3 is the node that keeps the doc honest, and
  it's the one whose absence shows up as a doc that contradicts a settled decision.
- **One flat gap list.** Without the layer split, UI gaps get filed against the state spec and
  quietly never actioned, because the person reading that spec correctly concludes none of it is
  theirs.
- **Tagging a story with a layer.** The split belongs on gaps. A story written in a person's voice
  that names an implementation layer has drifted back into being a spec.
- **Missing a gap because no spec owns it.** Reading every existing spec finds gaps *within*
  features and is structurally blind to a missing feature. Check the registry.
