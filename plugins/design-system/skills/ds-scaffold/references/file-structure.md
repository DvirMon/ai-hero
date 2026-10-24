# File Structure (Framework-Agnostic)

> Framework-specific file names/extensions live in the sibling file for your target framework (e.g. `file-structure.angular.md`). This file covers the folder layout and doc set that hold regardless of framework.
>
> `{dsComponentsRoot}` = the design system's shared components root (resolved from `designSystem.path` + `componentPathPattern` in the project's `ds-wayfinder.config.json`). `{componentPath}` = `{dsComponentsRoot}/{prefix}-<name>/`, this component's own working directory. `{dsPublicApiBarrel}` = the design system's root barrel file, resolved from config's `references.publicApiBarrel` (if unset, search the design system root for `index.ts`/`public-api.ts` instead of assuming one).

Every DS component lives under:

```
{dsComponentsRoot}/<{prefix}-component-name>/
```

## Full Structure

```
{prefix}-<name>/
├── docs/                                     ← planning docs (committed to repo)
│   ├── prd.md                                ← always: what, why, scope, API, acceptance criteria
│   ├── architecture.md                       ← complex components: pattern, primitive wiring, state machine
│   ├── design-tokens.md                      ← token-heavy components: Figma → CSS var mapping
│   ├── roles-map.md                          ← rich a11y: ARIA roles, keyboard contracts, focus flow
│   ├── decisions.md                   ← always: all Phase 2 interview decisions + scope triage
│   └── session-handoff.md                    ← always: session continuity handoff (current phase + state)
├── storybook/                                ← all stories and MDX live here
│   ├── {prefix}-<name>.designer.stories.ts      ← Designer stories (sidebar visible)
│   ├── {prefix}-<name>-styles.stories.ts        ← Token table (hidden, tags: ['!dev'])
│   ├── {prefix}-<name>.dev.stories.ts           ← Dev stories for MDX Canvas (hidden, tags: ['!dev'])
│   ├── {prefix}-<name>-doc-tabs.stories.ts      ← Doc-tabs navigation (hidden, tags: ['!dev'])
│   ├── {prefix}-<name>-api.stories.ts           ← API table stories (hidden, tags: ['!dev'])
│   ├── {prefix}-<name>-design-tokens.stories.ts ← Interactive token playground (optional, hidden, tags: ['!dev'])
│   ├── {prefix}-<name>-overview.mdx             ← component overview
│   ├── {prefix}-<name>-api.mdx                  ← API reference (tags: docs-only)
│   ├── {prefix}-<name>-styles.mdx               ← Styling/overrides (tags: docs-only)
│   ├── {prefix}-<name>-examples.mdx             ← Usage examples (tags: docs-only)
│   └── examples/                             ← helper components + snippet files (complex examples)
├── <component source files>                  ← see framework file for exact names/extensions
├── <styles file>                             ← see framework file
├── <test file>                               ← see framework file
├── index.ts                                  ← re-exports public entry point
├── public-api.ts                             ← exports component(s) + types
└── {prefix}-<name>.figma.ts                  ← Code Connect (required)
```

`docs/` and `tasks/` are **committed to the repo** — they are the persistent context for the component and serve as a reference for future contributors and reviewers.

## File Purposes

| File | Purpose |
|---|---|
| `docs/prd.md` | Component PRD — what, why, scope, API summary, acceptance criteria |
| `docs/architecture.md` | Architecture decisions — pattern, primitive wiring, state machine (complex only) |
| `docs/design-tokens.md` | Full token mapping — Figma layer → CSS var → purpose (token-heavy only) |
| `docs/roles-map.md` | ARIA roles, keyboard contracts, focus flow (rich a11y only) |
| `docs/decisions.md` | All Phase 2 interview decisions and scope triage (V1–V4) |
| `docs/session-handoff.md` | Session continuity — current phase, discovery findings, decisions |
| `index.ts` | Single export point — always re-exports `public-api` |
| `public-api.ts` | Everything a consumer needs: component(s) + all types |
| `{prefix}-<name>.figma.ts` | Code Connect — links Figma component to the framework implementation |

## Naming Conventions

- **Selector/tag:** `{prefix}-<name>` (kebab-case, always `{prefix}-` prefix)
- **Types:** `<Name>Variant`, `<Name>Size`, `<Name>Color` (PascalCase, descriptive suffix)
- See framework file for component/class/file naming specifics.

## `index.ts`

```typescript
export * from './public-api';
```

## `public-api.ts`

See framework file for exact export shape.

## Registering in `ui-core` Public API

After creating the files, add the component to the library's root public API:

```typescript
// {dsPublicApiBarrel}
export * from './lib/components/2.0/{prefix}-<name>';
```

## Reference: {prefix}-banner

[{prefix}-banner]({dsComponentsRoot}/{prefix}-banner/) — see this sibling component for a concrete example of the full structure.
