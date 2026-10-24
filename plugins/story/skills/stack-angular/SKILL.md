---
name: stack-angular
description: "Angular stack for the story plugin — how a story is built in Angular: one folder per story, a dedicated story-host component with a separate template, state in signals, on-canvas buttons calling the library's own updaters, MSW for simulated round-trips, thin .stories.ts and .mdx. Loaded by /story:create and the story:implementer agent when .claude/story.json names it under skills.create / skills.implement. Not invoked directly, and not for planning which stories exist (that is /story:plan)."
---

# Angular — how a story is built

Convention skill. It holds **how** a story is built in Angular.
**What** a story shows — one story per mechanism, named by
capability, clickable mutations, the baseline story — lives in
`/story:create` and `contracts/story-spec.md`. Don't restate
it; apply it through the mechanics below.

**Precedence.** The project's `{conventions}` doc
(`docs.conventions` in `.claude/story.json`) wins over this
skill. It is the project's own instance of the pattern — its
naming, folder layout, shared-fixture files. Reference
implementations belong there, not here.

## Why a host component

Angular CSF stories wrap a component; they don't inline markup
in a render function the way React's do. So every story gets a
dedicated story-host component that composes the library's
public API, and the `.stories.ts` file only points Storybook at
it.

## File layout — one folder per story, one concern per file

Folder: `paths.stories` from `story.json`.

```
<story>/
├── <story>-story-host.component.ts     ← the demo component
├── <story>-story-host.component.html   ← template, never inline
├── <story>.stories.ts                  ← Meta + exported story objects
└── <story>.mdx                         ← thin wrapper
```

- Host file name matches `paths.host` (default here:
  `*-story-host.component.ts`).
- Fixtures shared by a cluster of related stories (mock rows,
  schema builders, MSW handlers) go one level up, split by
  concern: `.types.ts`, `.mock.ts`, `.utils.ts`.
- No mock data or schema/config call inlined in the host.

## The story-host component

- **Standalone, separate template.** `templateUrl` /
  `styleUrl`, never an inline `template:` string. Demo-only
  code gets no exception.
- **Class name keeps the `Component` suffix**
  (`GatedEditStoryHostComponent`), even in a repo that drops it
  elsewhere — it marks a story harness, not a domain component.
- **Doc-comment** per the story-doc contract: the text comes
  from the spec's `## Doc comment`, verbatim. Design rationale
  (why this config, why a signal) goes in a `//` comment at
  the line it explains, never in that block.
- **State in signals** on the host. The host wires the
  library's public API together; it never reimplements the
  library's own logic.
- **Per-story transient UI state** (an open row editor, a
  pending flag) stays separate from library state, so the
  story shows which state the library owns.

## Controls → args

- A spec control maps to a Storybook arg on the story,
  surfaced via `argTypes`, and bound to a host `input()`.
- A live-wired arg (the host reacts as the control changes)
  needs the input read reactively — `computed()` or the
  library's signal-accepting API — not copied once at init.
- A control that only swaps a value is never a second story
  object.

## Actions → buttons

Every spec action is an on-canvas button in the host template.

- **Synchronous, local mutation** — the button calls the
  library's update function directly. Default.
- **Simulated server round-trip** — only when the story is
  about save/delete reliability (optimistic rollback, pending
  state, retry). Intercept a real `fetch()` with MSW; never
  stub a `Promise`. Thread `forceFailure` (boolean) and
  `latencyMs` (number) controls into request headers that the
  MSW handler reads, so the failure and latency paths are real
  intercepted requests. Handlers live with the shared
  fixtures; the story registers them via
  `parameters.msw.handlers`.
- An effect from *outside* the story's own buttons (an
  external write, a timer) is driven by a host button that
  simulates the outside actor, not by the actions panel.

## `.stories.ts`

- `Meta` points at the host component; `args` / `argTypes`
  carry the spec's controls.
- One exported story object per distinct mode or config the
  story demonstrates. Not one per control value.

## `.mdx`

- Thin wrapper: `Meta` / `Canvas` / `Source`, plus any shared
  code-tabs block the project's other `.mdx` files reuse.
- What the story proves lives in the host doc-comment, not
  here.
- Prose only for a non-obvious "why" a reader needs before the
  code (a deliberate composition choice) — never a restatement
  of the canvas.

## Verifying

Run the project's `typecheck` from `story.json` (default: the
project's own tsconfig). Never serve Storybook unprompted.
