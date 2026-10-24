---
name: stack-react
description: "React stack for the story plugin — how a story is built in React: a colocated <Component>.stories.tsx, args/argTypes as controls, render functions and decorators, explicit docs.source.code when the mechanism lives outside the render function, MSW for simulated round-trips, thin .mdx. Loaded by /story:create and the story:implementer agent when .claude/story.json names it under skills.create / skills.implement. Not invoked directly, and not for planning which stories exist (that is /story:plan)."
---

# React — how a story is built

Convention skill. It holds **how** a story is built in React.
**What** a story shows — one story per mechanism, named by
capability, clickable mutations, the baseline story — lives in
`/story:create` and `contracts/story-spec.md`. Don't restate
it; apply it through the mechanics below.

**Precedence.** The project's `{conventions}` doc
(`docs.conventions` in `.claude/story.json`) wins over this
skill. It is the project's own instance of the pattern — file
placement, Storybook scripts, token prefixes. Reference
implementations belong there, not here.

## File layout

- `<Component>.stories.tsx` at `paths.stories`, matching
  `paths.host` (default `*.stories.*`).
- Story-only styles (an override recipe) in a sibling
  `<Component>.stories.module.css`.
- Fixtures and MSW handlers shared across stories: separate
  `.mock.ts` / `.utils.ts`, never inlined in the stories file.
- Optional `<Component>.mdx` — thin wrapper, see below.

## Inputs to read first

The spec names the mechanism; the component tells you how to
reach it. Read its `.types.ts` (props surface) and its
stylesheet (CSS-driven behavior such as truncation, token
override hooks) before writing.

## Controls → args

- A spec control is an arg plus an `argTypes` entry. Swapping
  a value is a control, never a new story.
- The baseline story (conventionally `Playground`): baseline
  props via `args`, controls via `argTypes`, no decorators.
- Other stories reuse `args` and add only what their mechanism
  needs — a `render` function for composition, a decorator for
  a required environment (e.g. a width-constrained wrapper so
  truncation actually triggers).

## Naming and doc-comments

- Export name = capability (`LongFilename`, `StyleOverrides`),
  never input (`WithClassName`, `PDFVariant`).
- JSDoc on the story export, text from the spec's
  `## Doc comment`: what mechanism is shown and *why* it is
  built this way.

## Show code: mechanism outside the render function

Storybook's default `source: { type: 'auto' }` reads only the
render function. When the mechanism lives elsewhere — a sibling
CSS Module class, a token file, a wrapper in another file —
override that story's source with an explicit `code` string
holding **both** the external piece and the usage:

```tsx
parameters: {
  docs: {
    source: {
      type: 'code',
      language: 'tsx',
      code: `/* <Component>.stories.module.css */
.someOverride { --<prefix>-<component>-<token>: value; }

// usage
<div className={styles.someOverride}><Component ... /></div>`,
    },
  },
},
```

## Actions → interactive state

Every spec action is an on-canvas control in the rendered
story (a button wired through a `render` function with local
state, or the component's own callbacks), not an
actions-panel-only handler.

- **Synchronous mock state** — args, decorators, local state.
  Default.
- **Simulated server round-trip** — only when the story is
  about save/fetch reliability (loading, error, retry).
  Intercept the real `fetch` / API-client call with MSW
  (`parameters.msw.handlers`); never stub a `Promise`.
  `forceFailure` / `latencyMs` args drive the handler's
  response so the failure and latency paths are real
  intercepted requests.

## `.mdx`

- Thin wrapper: `Meta` / `Canvas` / `Source` (or `Stories`),
  plus any shared block the project's other `.mdx` files reuse.
- Prose only for a non-obvious "why" a reader needs before the
  code.

## Verifying

Run the project's `typecheck` from `story.json` (default: the
project's own tsconfig). Never start the Storybook script
unprompted.
