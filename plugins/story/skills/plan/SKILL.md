---
name: plan
description: >
  Plan or audit which Storybook stories a feature needs — compares the PRD and the
  peer-capability inventory from `/story:discovery` against the existing story-host code (not the
  thin `.mdx` wrappers) and writes a minimal target story set: extend or merge existing stories
  with new controls, a standalone story only for a mechanism big or cross-cutting enough to need
  its own showcase. Each target story maps 1:1 to a spec `/story:create` writes. Use for "do we
  have a story for X", "what stories are we missing", "should this be its own story", auditing
  Storybook coverage against a PRD, or right after a PRD with coverage marks (✅/🟡/❌) changes.
---

# Story planning

The PRD describes what a person needs to be able to do. Stories are supposed to prove those
things work — failure paths included. Over time the two drift: capabilities ship without a
story, stories get added ad hoc and overlap, and nobody has the table mapping product story to
story file. This skill produces that table and a plan to close the gap with the fewest stories
that give honest coverage.

## Config

Resolve `.claude/story.json` per `${CLAUDE_PLUGIN_ROOT}/contracts/story-config.md` — three
layers, merged, defaults applied — for the project the feature's path matches. No `story.json`
→ run `/story:setup` first. Misconfig stops with the key, path or skill named.

| Value | Used for |
|---|---|
| `{prd}` (`paths.prd`) | the product stories and their coverage marks |
| `{domainDir}/docs/discovery/` | the discovery files `/story:discovery` wrote |
| `paths.host` | which files to read as story hosts |
| `{stories}` (`paths.stories`) | where existing stories live; the `target` of new ones |
| `{specs}` (`paths.specs`) | where `/story:create` writes each target story's spec |
| `{conventions}` (`docs.conventions`) | the project's story shape |
| `docs.plan` | where the plan is written; unset → ask |
| `skills.plan` | load each before reading anything |

The PRD is the **capability variant** of `${CLAUDE_PLUGIN_ROOT}/contracts/prd.md`. Its FROZEN
rows are what this skill reads and re-derives; keep each line's source tag when you correct a
coverage mark.

## Inputs — gather all of them before step 1

The PRD is the *output* of discovery, not the discovery itself. It says what a person needs; it
rarely carries the evidence for **which affordance to render** for it. That evidence lives in
the discovery files.

| Input | Path | Answers | Decides |
|---|---|---|---|
| PRD | `{prd}` | what a person needs to be able to do | which stories must exist, what counts as covered |
| Peer-capability inventory | `{domainDir}/docs/discovery/peer-capabilities.md` | what shipped implementations render for it | each story's buttons and controls |
| Community pain | `{domainDir}/docs/discovery/community-pain.md` | what goes wrong in practice | which failure paths a story must show |
| Internal coverage | `{domainDir}/docs/discovery/internal-coverage.md` | what this codebase already ships | corrects stale coverage marks |

**The peer-capability inventory is required.** Missing → stop, say so, and offer
`/story:discovery`. Proceed without it only if the user says to, and then state in the plan's
header that every affordance is ungrounded. The other discovery files are optional; name each
missing one in the plan.

Older discovery may predate this layout. Sweep `{domainDir}/docs` once for files named
`*discovery*` / `*research*` or with `type: discovery` frontmatter, and read what matches the
feature.

Where peers **converge** on a convention, it is the default a story demonstrates — deviating is
a decision to state and justify. Where discovery names an affordance the library deliberately
does not ship, record it as a non-goal so no story implies it is first-class.

## Why read the host code, not the `.mdx`

An `.mdx` file is almost always a thin wrapper — `<Meta>`, `<Canvas>`, a `<Source>` block. It
rarely says what the story is *for*. Which verbs it calls, which buttons exist, which failure
paths are wired, which features it composes — that lives in the files matching `paths.host`.
Read them directly. A doc comment at the top of a host naming the product story it proves is the
most trustworthy signal available — better than the title or file name — but still verify it
(step 3).

## The four steps

### 1. Inventory what exists

One row per existing story in scope:

| Story | Composes / configured with | Actually demonstrates |
|---|---|---|

The third column comes only from the host's logic: which handlers it calls, what each button
does, what happens on failure, what story controls toggle. Not from the name or folder — names
drift as stories get extended.

### 2. Cross-reference against the PRD

Classify every PRD story against the inventory:

- **Covered** — an existing story exercises it, including its failure behavior if the PRD
  specifies one. Happy path only does not cover a story whose criteria include a failure case.
- **Partially covered** — the mechanism exists in code (a function, a verb, a flag) but nothing
  on screen lets a person see or trigger it. The most common and most easily missed gap: a grep
  finds the verb, so it looks done, but the PRD is about what a *person* can do.
- **Not covered** — nothing touches it.

Also flag **redundancy**: two stories differing by one variable (timing, success vs. failure,
one extra button) are candidates to merge into one story with a control.

### 3. Decide the target story set

Five constraints, in order.

**Minimize story count.** Default to folding a gap into an existing story as a new button,
control or keybinding. A mechanism earns a standalone story only when it is large or
cross-cutting enough to need its own showcase — "if someone opened only this story, would they
understand the whole mechanism, or is half of it in another file?" Genuine candidates: a
mechanism composing several features together; an end-to-end flow with distinct states worth
seeing in sequence (optimistic update: capture → in-flight → success/rollback); a conflict or
edge-case flow that would clutter a baseline. When in doubt, extend and see if it becomes
unreadable — that is the real signal to split.

**Or: would bundling teach the wrong distinction?** Size is not the only reason to split. Two
small options that are conceptually adjacent enough to confuse — one deciding *whether* a
behavior is on, another deciding *which items* it applies to, with easily-confused names — each
deserve their own story. Bundled, the host teaches the wrong model of which knob does what. The
question is "would a person need to hold these apart", not "how many controls". Two options that
are one lesson (a derived value and its display label) stay in ONE story.

**Ground every affordance in the inventory.** Before writing that a story needs a button,
control or keybinding, check what peers render for that job. Where they converge, adopt it — a
person should recognise the affordance, and a consumer copying the host gets an interaction
their users already know. Deviate only deliberately, and say why. No peer rendering what you
were about to propose usually means it was invented to fit the PRD's wording. A plan whose
controls are all invented reads plausibly and demos badly.

**Scope each story to what it proves.** A host is what a consumer copies to implement the
feature shown — not a sketch of a realistic app around it. For each element, ask: does it serve
the product story this host proves, or is it app chrome (a confirm dialog, a toast system, a
banner for an unrelated failure)? Chrome doesn't belong, however cheap. A story covers several
product stories only when they are inherent to the surface as a whole — an editable list showing
sort + edit + delete together, because that is what an editable list *is*. When auditing, check
every rendered element against the PRD entry it serves, and verify a host's doc comment against
that entry's acceptance criteria — comments misattribute flows. Design-only stories (visual
states, layout) are exempt from the copy-paste framing.

**Mock actions as on-canvas buttons.** Any story representing a network or async effect needs a
button that drives the outcome — success, failure, latency — in the rendered story. Not the
actions panel alone (it logs, it doesn't show the resulting state), not a real backend. Reuse
the mocking pattern `{conventions}` records.

### 4. Write the plan

Write it to `docs.plan` (unset → ask where). A prior plan there → reference it by name and write
this as the follow-up gap analysis instead of repeating it.

**One section per target story that needs work.** Each maps 1:1 to the spec `/story:create`
writes, so it carries that spec's frontmatter values:

```markdown
## <story> — <Title>

story: <slug, kebab-case, named by capability>
mode: new · extend · merge
target: <paths.stories rendered for this story>
merges: [<story slugs folded in>]      # merge only
covers: [<PRD ids>]
spec: <paths.specs rendered>

| Product story covered | Covered by |
|---|---|
| <PRD id> | existing — what it already does · **new** — what to add · **merge <old-story> in** |
```

A story already covering everything it should needs no section and no spec — it appears only in
the Summary as `existing`. A story covering no PRD id says why in one line (design-only,
integration pitfall).

Close with:

- **Left out on purpose** — `item | why not a story`: blocked on an unbuilt dependency, would
  present an unsupported pattern as first-class, or is a doc fix rather than a mechanism.
- **Summary** — one row per target story: name, status (existing / extend / new / merge), and —
  only for a standalone story — one line on why it earned its own file.

Then hand off: `/story:create <story>` per section, one spec each.

## Follow the project's conventions

The plan's "new" column describes additions that fit `{conventions}` — its file layout, host
shape, how it mocks server effects, naming — not a generic shape. `docs.conventions` unset → say
so and offer `/story:docs` to write one. The plan and the conventions doc are complementary, not
the same document.

## Pitfalls

- An `.mdx` title suggesting broad coverage over a host that wires only the happy path — the
  failure behavior a product story asks for is quietly missing.
- Two stories 80% identical except one timing or ordering detail, kept as separate files out of
  habit instead of a control.
- A capability shipped in code (a new function, a new option) with no story — the review that
  shipped it asked "does the function work", not "can a person see this".
- An integration-pitfall demo (showing a *wrong* way, or developer plumbing) treated as a
  person-facing feature on equal footing with real stories.
- A story bolting on a realistic flow that proves a different product story than its doc comment
  claims. Verify against the PRD section, not the comment.
- Two adjacent-but-distinct options folded into one story because each seemed too small —
  teaching the wrong boundary instead of saving a file.
- A control with no peer behind it and no stated reason — invented, not grounded.
