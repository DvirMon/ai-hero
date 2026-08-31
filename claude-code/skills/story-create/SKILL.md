---
name: story-create
description: "Write a Storybook story for a component that already exists — SSOT for story-creation conventions, framework-agnostic core plus a per-framework reference (React, Angular). Sibling to /implement (component generation); invoked after implementation is done, or ad hoc when asked to add/write a story."
disable-model-invocation: true
---

Write a Storybook story for a component/library that already exists. This skill owns the
*conventions* for what makes a good story — don't re-derive them per component, and don't
assume the shape of a story is framework-agnostic mechanics plus a framework-specific
execution layer, held apart deliberately: the reasoning for *what* to demonstrate and *how many*
stories to write transfers across frameworks; *how* a story is built (render function vs.
component class, args vs. signals, `.tsx` vs. a template file) does not.

> **Role in the pipeline:** knowledge SSOT, not an executor. `/implement` dispatches
> `Task type: story` steps to a framework-specific implementer agent (e.g. `story-implementer`
> for React), which loads this skill and then writes the stories. Read it directly for ad-hoc
> story work.

## Goal

A story's job isn't "render this variant" — it's to make the *mechanism* reproducible. Someone
reading the story (or its "Show code" panel, where the framework has one) should be able to
copy what they see and get the same behavior in their own code, without opening a second file
to find a piece the story used but didn't show.

## Framework-agnostic core

Apply these regardless of stack — they're about what a story is *for*, not how it's built.

1. **Identify capabilities, not prop values.** Read the component's spec/decisions doc and its
   type definitions. List the distinct mechanisms worth demonstrating: the baseline/default
   render, anything whose behavior isn't obvious from the public API alone, and anything the
   spec calls out as a deliberate design decision a consumer needs to know how to invoke.
2. **One story per mechanism, not per data permutation.** If a control/arg already lets a
   viewer swap a value and see the same code path render differently, that's not a new story —
   it's a control. Add a dedicated story only when the underlying *behavior* differs (a
   different feature composed, a different failure path, a different structural case).
3. **Name and document by capability, not by input.** A story name and its doc-comment should
   say what mechanism it proves (`LongFilename`, `StyleOverrides`, `OptimisticRollback`), not
   what values were passed in (`WithClassName`, `PDFVariant`). State *why* it's built the way
   it is when that's non-obvious — a design decision, a composition choice, a known limitation
   — not a restatement of what's visible in the render.
4. **Make every mutation clickable, not just logged.** A person reading the story should be
   able to trigger every action it's meant to demonstrate — a save, a delete, an error — from
   an on-canvas control and see the resulting state change. A Storybook actions-panel-only
   trigger or a bare console log doesn't make a mechanism reproducible; it just proves the
   event fired.
5. **Simulate server effects realistically when the story is about reliability.** For a story
   whose whole point is a save/fetch's success, failure, or latency behavior, prefer
   intercepting a real request (MSW or the ecosystem's equivalent) over stubbing a bare
   `Promise` — controls for forcing failure or adding latency should drive a real intercepted
   response, not a fake await. A story that's just demonstrating a synchronous UI state doesn't
   need this weight.
6. **If the mechanism lives outside what the story directly renders** — a sibling stylesheet,
   a token file, a composition pattern in another file — make sure whatever "show me the code"
   surface the framework offers captures that external piece too, not just the story's own
   render call. A copyable recipe that's missing half the puzzle isn't actually reproducible.
7. **Keep the baseline story minimal.** The first/default story exists to show the component
   with nothing exceptional — no decorators, no forced states. Every other story earns its
   place by proving something the baseline plus its controls can't already show.

## Pick the framework reference

These principles hold across frameworks; the mechanics of applying them don't. Detect the
target's stack (check the project's existing components/stories, its `package.json`, or ask if
genuinely ambiguous) and read the matching reference before writing anything:

- **React** → `references/react.md` (`.stories.tsx`, args/decorators, CSS Modules, MSW).
- **Angular** → `references/angular.md` (a dedicated story-host component, signals, a
  library's own update functions, MSW).

If the target framework has no reference file yet, don't invent one silently — say so, apply
the framework-agnostic core as best judgment, and flag that a new reference is worth adding
once the pattern is proven (same as `react.md` and `angular.md` were each written from one
real, shipped example rather than speculatively).

## Verifying

Run whatever the project's static check is (typecheck, lint) after writing. If asked to verify
visually, ask before starting a dev/Storybook server — don't serve unprompted.
