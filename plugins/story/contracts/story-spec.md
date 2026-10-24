# Story spec

The hand-off from `/story:create` to the `story:implementer` agent. One file per story, at
`paths.specs` (`{domainDir}/docs/stories/{story}.story.md`). `/story:create` writes it;
the implementer reads it and writes the code. The spec says *what the story shows and how a
person drives it*; the stack skills say *how that is built*.

An sdlc `type: story` step file is a valid spec too: its `## Do` carries the same sections,
and the implementer reads it the same way.

## Shape

````markdown
---
story: gated-edit
project: table
mode: new            # new · extend · merge
target: libs/shared/table/src/stories/gated-edit/
merges: []           # stories folded into this one (mode: merge)
covers: [3.2, 3.4]   # PRD story ids
---
# Gated edit

One sentence: the mechanism this story proves.

## Composes

The public API the host wires together. Names only — no implementation.

## Controls

| Control | Kind | Drives |
|---|---|---|
| Force failure | toggle | the next save rejects |
| Latency | number (ms) | save round-trip delay |

## Actions

Every on-canvas button and what a person sees after clicking it, success and failure.

## Mocks

Fixtures and intercepted requests the story needs, and where they live.

## Doc comment

The 3-8 line block per `story-doc.md`, final text.

## Out of scope

## Done when
````

- **`covers`** cites PRD ids; a story covering no PRD id must say why in its one-line summary
  (design-only story, integration pitfall).
- **Controls and Actions** come from the capability inventory `/story:discovery` wrote, not
  invented — an affordance peers don't render is stated as a deliberate deviation.
- No stack mechanics (render functions, signals, file extensions) — those belong to the stack
  skill the implementer loads.
