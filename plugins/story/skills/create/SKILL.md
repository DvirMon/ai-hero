---
name: create
description: >
  Design ONE Storybook story — from a `/story:plan` section or an ad-hoc request — and write its
  story spec (what it shows, its controls, actions, mocks, doc comment), then dispatch the
  `story:implementer` agent to write the code from that spec. Owns the framework-agnostic story
  principles: one story per mechanism, named by capability, every mutation clickable. Use for
  "add a story for X", "write the story for <plan entry>", or after a component lands that needs
  a story. Does not decide which stories a feature needs (`/story:plan`) or write a PRD
  (`/story:discovery`).
---

# Story create

Designs one story and writes its spec at `{specs}` per
`${CLAUDE_PLUGIN_ROOT}/contracts/story-spec.md`. It writes no story code — the
`story:implementer` agent does, from the spec. The spec says *what the story shows and how a
person drives it*; the stack skills say *how that is built*.

The split is deliberate: *what* to demonstrate and *how many* stories transfers across stacks;
*how* a story is built (render function vs. host component, args vs. signals, `.tsx` vs. a
template file) does not.

## Config

Resolve `.claude/story.json` per `${CLAUDE_PLUGIN_ROOT}/contracts/story-config.md` — three
layers, merged, defaults applied — for the project the target matches. No `story.json` → run
`/story:setup` first. Misconfig stops with the key, path or skill named.

| Value | Used for |
|---|---|
| `skills.create` | loaded before designing — they say what is feasible on this stack |
| `{conventions}` (`docs.conventions`) | the project's story shape; wins over a stack skill |
| `{prd}` (`paths.prd`) | the ids the spec `covers` |
| `{domainDir}/docs/discovery/peer-capabilities.md` | where Controls and Actions come from |
| `docs.plan` | the plan section this story comes from |
| `{stories}` (`paths.stories`) | the spec's `target` |
| `{specs}` (`paths.specs`) | where the spec is written |
| `skills.implement`, `typecheck` | passed to the implementer |

**`skills.create` empty:** apply the core below only, and say in the report that no stack skill
was named — the spec may ask for something the stack makes awkward.

## Goal

A story's job isn't "render this variant" — it's to make the *mechanism* reproducible. Someone
reading the story (or its "Show code" panel, where the stack has one) should be able to copy
what they see and get the same behavior, without opening a second file to find a piece the story
used but didn't show.

## Process

1. **Resolve config** (above). Invoke each `skills.create` skill via the Skill tool. Read
   `{conventions}` when set.
2. **Find the input.**
   - **From the plan:** read the story's section in `docs.plan`. Its `story`, `mode`, `target`,
     `merges`, `covers` become the spec's frontmatter as-is — don't re-decide them.
   - **Ad hoc:** derive them yourself. Check `docs.plan` and `{stories}` first; the story may
     already be planned or exist (→ `extend`). A request that implies several stories → stop and
     suggest `/story:plan`.
   - **From a calling plugin** (design-system Phase 5): the caller passes the component path,
     `prdPath`, an API summary and one story line from its plan step. Treat the line as the
     plan section: `mode: new` unless `{stories}` already holds it. The API summary stands in
     for reading public types.
3. **Read the evidence.** The component's spec/decisions doc and public types; the PRD
   entries in `covers`; the peer-capability inventory. Missing inventory → say so, and mark
   every Control and Action in the spec as ungrounded. `extend` / `merge` → read every existing
   host and story file involved, in full.
4. **Design** with the core below. Every Control and Action traces to the inventory, or the
   spec states it as a deliberate deviation.
5. **Write the spec** at `{specs}` for this `{story}`, every section of the contract filled. No
   stack mechanics in it. The Doc comment is final text per
   `${CLAUDE_PLUGIN_ROOT}/contracts/story-doc.md`.
6. **Dispatch the `story:implementer` agent:**

   | Input | Value |
   |---|---|
   | `specPath` | the spec's absolute path |
   | `skills` | `skills.implement` |
   | `typecheck` | the project's `typecheck` |

   Several specs at once → one dispatch per spec, in parallel only when their `target` and
   `merges` don't overlap.
7. **Report** the spec path, the implementer's output as returned, and — when `skills.create`
   was empty — that the core ran alone. `merge` → name the old folders the implementer listed
   for deletion; delete them only when the user says so.

## Framework-agnostic core

1. **Identify capabilities, not prop values.** From the component's spec and types, list the
   distinct mechanisms worth demonstrating: the baseline render, anything whose behavior isn't
   obvious from the public API, and anything the spec calls a deliberate decision a consumer
   needs to know how to invoke.
2. **One story per mechanism, not per data permutation.** If a control already lets a viewer
   swap a value and see the same code path render differently, that's a control, not a story.
   A new story only when the *behavior* differs — a different feature composed, a different
   failure path, a different structural case.
3. **Name and document by capability, not by input.** The name and doc comment say what
   mechanism it proves (`LongFilename`, `StyleOverrides`, `OptimisticRollback`), not the values
   passed (`WithClassName`, `PDFVariant`). State *why* it's built this way when non-obvious — a
   design decision, a composition choice, a known limitation — not what the render already shows.
4. **Make every mutation clickable, not just logged.** A person can trigger every action the
   story demonstrates — save, delete, error — from an on-canvas control and see the resulting
   state. An actions-panel-only trigger or a console log proves the event fired, not the
   mechanism.
5. **Simulate server effects realistically when the story is about reliability.** For a story
   whose point is a save or fetch's success, failure or latency, specify an intercepted real
   request (the project's request-mocking layer) over a bare stubbed promise — failure and
   latency controls drive that intercepted response. A synchronous UI-state story doesn't need
   this weight.
6. **If the mechanism lives outside what the story renders** — a sibling stylesheet, a token
   file, a composition in another file — the spec's Done when requires the "show code" surface
   to capture it too. A recipe missing half the puzzle isn't reproducible.
7. **Keep the baseline story minimal.** The default story shows the component with nothing
   exceptional — no decorators, no forced states. Every other story earns its place by proving
   something the baseline plus its controls can't.

## Rules

- One story per run. The spec is the only file this skill writes.
- Never start Storybook or a dev server, never run tests. The implementer typechecks.
- Underspecified in a way the plan, PRD, inventory and `{conventions}` can't resolve → ask one
  question, don't guess.
