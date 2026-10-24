# React — story creation

Generate `<Component>.stories.tsx` for a component that already exists (implemented via
`/implementation`, following `/react-developer`).

## Process

1. Read the component's `docs/spec.md` (Implementation Decisions + Out of Scope), its
   `.types.ts`, and its `.module.css`. Identify the distinct **capabilities/mechanisms** worth
   demonstrating — not every prop value, every *mechanism*:
   - The baseline/default render.
   - Anything whose behavior isn't obvious from props alone (CSS-driven truncation, a token
     override path, a keyboard-nav pattern, a compound-component composition).
   - Anything the spec explicitly calls out as a deliberate design decision a consumer needs
     to know how to invoke (e.g. "override via your own CSS Module, not inline style").
2. One story per distinct mechanism, not per data permutation. If `argTypes` + Storybook's
   controls panel already let a viewer swap a prop value (e.g. `format: "PDF"` vs `"PNG"`),
   that's not a new story — it's a control. Add a dedicated story only when the underlying
   *behavior* differs.
3. Name and doc-comment each story after the capability it proves (`StyleOverrides`,
   `LongFilename`), not after the prop values passed in (`WithClassName`, `PDFVariant`). The
   doc-comment states what mechanism is shown and *why* it's built that way, not just what
   props are set.
4. **If the mechanism lives outside the story's render function** — a sibling CSS Module
   class, a token file, a wrapping pattern in a different file — Storybook's default
   `source: { type: 'auto' }` (see `.storybook/preview.ts`) won't capture it; it only reads
   the render function. Override that story's `parameters.docs.source` with an explicit
   `code` string containing *both* the external piece and the usage, so "Show code" is a
   complete, copyable recipe:
   ```tsx
   parameters: {
     docs: {
       source: {
         type: 'code',
         language: 'tsx',
         code: `/* <Component>.stories.module.css */
   .someOverride { --issa-comp-<component>-<token>: value; }

   // usage
   <div className={styles.someOverride}><Component ... /></div>`,
       },
     },
   },
   ```
5. Keep the default/first story (conventionally `Playground`) minimal — baseline props via
   `args`, controls wired via `argTypes`, no decorators. Every other story earns its place by
   proving something `Playground` + controls can't already show.
6. Run typecheck after writing (`nx run <project>:typecheck`). If asked to verify visually,
   ask before starting `npm run issa:storybook` (or the project's Storybook script) — don't
   serve unprompted.

## Simulating network effects

Prefer args/decorators for synchronous mock state. For a story specifically about save/fetch
reliability (loading, error, retry), intercept a real `fetch`/API client call with MSW rather
than stubbing a `Promise` — args exposed as Storybook controls (e.g. `forceFailure`,
`latencyMs`) drive the mocked response so the failure/latency path is a real intercepted
request, not a fake await.

## Reference implementation

`apps/issa-landing/src/design-system/components/chip/Chip/Chip.stories.tsx` — `Playground`
(baseline), `LongFilename` (CSS-driven truncation mechanism, needs a width-constrained
decorator to actually trigger), `StyleOverrides` (external CSS Module override, with an
explicit `docs.source.code` since the CSS lives in a separate file the auto-source can't see).
