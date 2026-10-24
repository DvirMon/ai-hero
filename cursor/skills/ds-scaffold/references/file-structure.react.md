# File Structure — React

> Folder layout and doc set live in `file-structure.md` (agnostic). This file is React file names/extensions only.
>
> `{componentPath}` = this component's own working directory (see `file-structure.md` legend for full resolution).

## Component Source Files

```
{prefix}-<name>/
├── {Prefix}<Name>.tsx                        ← component + type definitions
├── {Prefix}<Name>.module.css                 ← styles (CSS Modules)
├── {Prefix}<Name>.test.tsx                   ← unit tests (logical flow only)
├── index.ts                                  ← re-exports public-api
├── public-api.ts                             ← exports component + types
└── {prefix}-<name>.figma.ts                  ← Code Connect (required)
```

## File Purposes

| File | Purpose |
|---|---|
| `{Prefix}<Name>.tsx` | Component function, all type definitions, props |
| `{Prefix}<Name>.module.css` | Role token usage, variant state classes, CSS custom property API |
| `{Prefix}<Name>.test.tsx` | Unit tests for logical flow and calculations only |
| `.figma.ts` | Code Connect — links Figma component to the React implementation |

## Naming Conventions

- **Component:** `{Prefix}<Name>` (PascalCase, no suffix — e.g. `AteraCard`, not `AteraCardComponent`)
- **Files:** `{Prefix}<Name>.tsx` (PascalCase, matches the exported component name)
- **Hooks:** `use{Prefix}<Name>` (camelCase, `use` prefix, colocated as `use{Prefix}<Name>.ts` when extracted)

## `public-api.ts`

```typescript
export { {Prefix}<Name> } from './{Prefix}<Name>';
export type { <Name>Variant, <Name>Size } from './{Prefix}<Name>';
```

## Reference: {Prefix}Banner

```
{prefix}-banner/
├── {Prefix}Banner.tsx
├── {Prefix}Banner.module.css
├── {Prefix}Banner.test.tsx
├── index.ts
├── public-api.ts
└── {prefix}-banner.figma.ts
```

[{prefix}-banner]({dsComponentsRoot}/{prefix}-banner/)
