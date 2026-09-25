---
name: story-plan
description: >
  Plan or audit which Storybook stories a feature needs by comparing a product user-stories
  doc against the existing *-story-host component code (not just the thin .mdx wrappers).
  Produces a minimal target story set: extend/merge existing stories via new buttons and
  toggles, and only add a standalone new story for a mechanism large or cross-cutting enough
  to need its own showcase. Use this whenever the user asks "do we have a story for X",
  wants to plan/audit Storybook coverage for a feature, asks to compare stories against a
  product/spec/PRD doc, or says something like "what stories are we missing" or "should this
  be its own story". Also trigger proactively after writing or updating a product user-stories
  doc that has coverage marks (✅/🟡/❌) — that doc's coverage marks are exactly what this
  skill re-derives.
---

# Storybook story planning

A product user-stories doc (organized by feature area, usually with coverage marks like
✅/🟡/❌ or similar) describes what a person needs to be able to do. Existing Storybook
stories are supposed to demonstrate that those things work — including the failure paths, not
just the happy path. Over time the two drift apart: new capabilities ship without a story,
stories get added ad hoc and start overlapping, and nobody has a table showing which product
story maps to which `.stories.ts` file. This skill produces that table and a plan to close the
gap, favoring the smallest number of stories that gives honest coverage.

## Why read the story-host code, not the `.mdx`

A Storybook `.mdx` file is almost always a thin wrapper — `<Meta>`, `<Canvas>`, a `<Source>`
block showing the host component's own code. It rarely says what the story is *for*. The real
answer — which mutation verbs it calls, which buttons exist, which failure paths are wired up,
which feature flags/config it composes — lives in the story-host component
(`*-story-host.component.ts` or equivalent, whatever the project's naming convention is). Always
read that file directly. Treat a comment at the top of the host component (if one exists,
labeling which product story it's proving) as the most trustworthy signal available — better
than the mdx title, better than the file name.

## Gather every input before step 1 — the product doc is not the whole discovery surface

A product user-stories doc is usually the *output* of upstream discovery, not the discovery
itself. It answers what a person needs to be able to do; it rarely carries the evidence that
decided **what affordance to render for it**. That evidence often sits in sibling discovery
artifacts the product doc distilled and then dropped — competitor/UX capability inventories,
community-pain writeups, internal-coverage audits.

Before inventorying anything, sweep for them. Don't read one folder and treat it as the whole
surface — discovery and product docs frequently live in different parts of a docs tree
(a `0-product/` folder and a `work/<feature>/` folder, say):

```
find <docs-root> \( -iname "*discovery*" -o -iname "*research*" \)
grep -rlE "^type: (discovery|research)" <docs-root>
```

Read whatever that turns up for the feature in scope. A **capability inventory across peer
libraries** is a required input, not optional colour: it is the only source that says what a
person actually clicks in a shipped implementation of this feature, and it is what keeps a plan
from inventing affordances nobody uses. The two inputs do different jobs and neither substitutes
for the other:

| Input | Answers | Decides |
|---|---|---|
| Product user-stories doc | what a person needs to be able to do | which stories must exist, and what counts as covered |
| Peer-library capability discovery | what affordance shipped implementations render for it | what each story's buttons/controls actually look like |
| Community-pain discovery | what goes wrong for people in practice | which failure paths a story must demonstrate, not just the happy path |
| Internal-coverage discovery | what this codebase already ships | corrects stale coverage marks in the product doc |

When the capability discovery shows peers **converging** on one convention, that convention is
the default a story demonstrates — deviating from it is a decision to state and justify, not a
free choice. Where the discovery names an affordance the library deliberately does not ship,
record it as an explicit non-goal so a story never implies an unsupported pattern is
first-class.

If no such discovery exists for the feature, say so in the plan rather than silently proceeding
as though the product doc were the whole input — a missing capability inventory is a real gap
in the plan's grounding, and worth naming.

## The four-step process

### 1. Inventory what exists

For every existing story in scope, build a table with three columns:

| Story | Composes / configured with | Actually demonstrates |

The third column comes only from reading the host component's logic: which verbs/handlers it
calls, what each button does, what happens on failure, what's toggled by story controls. Don't
infer this from the story's name or folder — names drift from what a story actually tests as it
gets extended over time.

### 2. Cross-reference against the product doc

Walk every user story in the product doc (a numbered list, a table with coverage marks,
whatever shape the project uses) and classify it against the inventory from step 1:

- **Covered** — an existing story exercises it, including its failure behavior if the product
  story specifies one. A story that only shows the happy path does not fully cover a product
  story whose acceptance criteria include a failure case.
- **Partially covered** — the underlying mechanism exists in code (a function, a verb, a
  feature flag) but nothing on screen lets a person see or trigger it. This is the most common
  and most easily missed gap: a `grep` for the verb name will find it in the codebase, so it's
  tempting to mark it "done," but the product doc is about what a *person* can do, not what
  API surface exists.
- **Not covered** — nothing anywhere touches it.

Also flag **redundancy**: two stories that differ by one variable (timing, success vs. failure,
one extra button) are candidates to merge into one story with a toggle, rather than staying two
near-duplicate files.

### 3. Decide the target story set

Apply five constraints, in this order:

**Minimize story count.** Default to folding a gap into an existing story as a new
button/control/toggle/keybinding. Only give a mechanism its own standalone story when it is
large or cross-cutting enough to need its own showcase on its own terms — ask "if someone opened
only this one story, would they understand the whole mechanism, or are they missing half of
it because it's scattered across two files?" Genuine candidates for standalone status:
a mechanism that composes multiple features together (e.g. two plugins/behaviors combined),
an end-to-end flow with several distinct states worth seeing in sequence (e.g. optimistic
update: capture → in-flight → success/rollback), or a conflict/edge-case flow that would clutter
a baseline story if bolted on. When in doubt, don't create a new file — extend an existing one
and see if it becomes unreadable; that's the actual signal a split is warranted, not a guess in
advance.

**Or: would bundling risk teaching the wrong distinction?** A second, independent test — size
is not the only reason to split. Two options can each be individually small and still each
deserve their own story when they are conceptually adjacent enough that a consumer could
confuse which one governs what (e.g. a level's *activation* predicate vs. its *admission*
predicate — different questions with easily-confused names). Bundling them into one host risks
teaching the wrong mental model of which knob does what, even though neither alone is "large or
cross-cutting." The question is "would a person need to hold these two things apart," not "how
many controls does this take" — two options that are genuinely one coherent lesson (e.g. what a
derived value is, and what its display label says) belong in ONE story with multiple controls,
same as any other single-lesson story.

**Ground every affordance in the capability discovery.** Before writing that a story needs a
given button, toggle or keybinding, check what shipped peer implementations actually render for
that job (per the discovery sweep above). Where peers converge, adopt the convention — a person
opening the story should recognise the affordance, and a consumer copying the host should get an
interaction shape their users already know. Deviate only deliberately, and say why in the plan.
Where no peer renders what you were about to propose, that is usually a sign the affordance was
invented to fit the product doc's wording rather than drawn from practice. A plan whose controls
are all invented reads plausible and demos badly.

**Scope each story's code to what it's proving.** A story's host component is what a consumer
copies to implement the feature(s) being shown — not a sketch of a realistic app built around
it. Before adding (or keeping) a button, control, or UI element, ask: does this serve the
specific product story this host proves, or is it app chrome a real consumer would plausibly add
regardless of which feature they were implementing — a confirm dialog, a toast system, a notice
banner for an unrelated failure mode? If the latter, it doesn't belong, even if it's realistic
and cheap to add. A story may cover several product stories at once only when they're inherent
to the surface being shown as a whole — a "live table" story demonstrating sort + edit + delete
together, because that's what a live table *is* — not because bundling a nearby feature was
convenient. When auditing an existing story, check every element it renders against which
product-doc entry it actually serves; a host's doc-comment claiming which decision it proves is
a strong signal (per the note above) but not proof by itself — verify the claim against that
product story's own acceptance criteria, since a comment can misattribute a flow to the wrong
entry just as easily as it can correctly name one. Design-only stories (a component's visual
states or layout, not a product feature) are exempt from the "copy-paste code" framing — the
story itself is the design surface under review, not an implementation to lift.

**Mock actions as on-canvas buttons, not documentation-only artifacts.** Any story representing
a network or async effect (save, delete, fetch, search, whatever's relevant to the domain)
needs a button that flips local state to simulate the outcome — success, failure, latency —
directly in the rendered story. Don't rely on the Storybook actions panel alone (it logs but
doesn't demonstrate the resulting UI state) and don't require a real backend. If the project
already has a pattern for this (e.g. force-failure/latency story controls, an intercepted
`fetch`), reuse it rather than inventing a new mechanism.

### 4. Write the plan

Structure the output as one table per target story:

| Product story covered | Covered by |
|---|---|
| (doc section / id) | existing — what it already does, OR **new** — what needs to be added, OR **merge <old-story> in** if this absorbs another file |

Follow with two closing sections:

- **Left out on purpose** — a table of `item | why not a story` for anything deliberately
  excluded: blocked on an unbuilt dependency, would misrepresent an unsupported/edge-case
  pattern as a first-class feature if shown as its own story, or is a recipe/doc fix rather than
  a demonstrable mechanism.
- **Summary** — one row per target story: name, status (existing / extend / new / merge), and
  — only for a standalone story — a one-line reason it earned its own file rather than folding
  into another.

## Follow a project's existing story-creation conventions if one is recorded

Before proposing new buttons/controls/files, check whether the project has already written down
its own story-shape conventions (file layout, component vs. inline template, how it mocks
network effects, naming). If one exists, the plan's "new" column should describe additions that
fit that convention, not a generic shape. Example: `libs/shared/table/docs/3-ui/stories.md`
records this repo's pattern for `libs/shared/table` — separate template file, `Component`-suffixed
host class, a doc-comment naming which decision the story proves, MSW for simulated server
round-trips vs. a plain `await` for simple pessimistic saves. If no such doc exists for the
project in scope, say so and offer to write one alongside the plan — the plan and the
conventions record are complementary, not the same document.

## Where the output goes

Don't leave this as chat-only output if the project has a docs convention for episodic planning
work (a numbered work-folder pattern, an ADR/decision-log structure, etc.) — write it as the
next document in that convention. Before writing, check whether a prior proposal or plan already
exists in the same location; if so, reference it by name and describe this as the follow-up gap
analysis rather than repeating its content. If the project has no such convention, ask where the
user wants it, or default to returning it as a chat artifact.

## Common pitfalls this process catches

- A story whose `.mdx` title suggests broad coverage but whose host component only wires up the
  happy path — the failure behavior a product story explicitly asks for is quietly missing.
- Two stories that are 80% identical except for one timing/ordering detail, kept as separate
  files out of habit rather than a toggle.
- A capability that shipped in the underlying code (a new function, a new config option) with no
  story ever added for it — easy to miss because the code review that shipped it wasn't asking
  "does a person have a way to see this," it was asking "does the function work."
- Treating an integration-pitfall or edge-case demo (something that exists to show a *wrong* way
  of doing something, or a developer-facing plumbing concern) as if it were a supported
  person-facing feature deserving equal footing with the real stories.
- A story bolts on a flow that's realistic for a real app but proves a different (or no) product
  story than the one its host's doc-comment claims — the comment cited the wrong acceptance
  criteria, or none at all. Verify the claim against the product doc's actual section, don't take
  the comment's word for it.
- Two adjacent-but-distinct options (activation vs. admission, deriving a value vs. labeling it)
  folded into one story because each alone seemed too small to stand on its own — teaching the
  wrong boundary between them instead of saving a file.
