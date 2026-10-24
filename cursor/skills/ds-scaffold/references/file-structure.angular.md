# File Structure — Angular

> Folder layout and doc set live in `file-structure.md` (agnostic). This file is Angular file names/extensions only.
>
> `{componentPath}` = this component's own working directory (see `file-structure.md` legend for full resolution).

## Component Source Files

```
{prefix}-<name>/
├── {prefix}-<name>.component.ts                 ← component class + type definitions
├── {prefix}-<name>.component.html               ← template
├── {prefix}-<name>.component.scss               ← styles
├── {prefix}-<name>.component.spec.ts            ← unit tests (logical flow only)
├── index.ts                                  ← re-exports public-api
├── public-api.ts                             ← exports component class + types
└── {prefix}-<name>.figma.ts                  ← Code Connect (required)
```

## File Purposes

| File | Purpose |
|---|---|
| `.component.ts` | Component class, all type definitions, signal inputs/outputs |
| `.component.html` | Template — control flow, `ng-content` slots, host directives |
| `.component.scss` | Role token usage, variant state classes, CSS custom property API |
| `.component.spec.ts` | Unit tests for logical flow and calculations only |
| `.figma.ts` | Code Connect — links Figma component to the Angular implementation |

## Naming Conventions

- **Selector:** `{prefix}-<name>` (kebab-case, always `{prefix}-` prefix)
- **Class:** `{PascalPrefix}<Name>Component` (PascalCase, always `Component` suffix)
- **Files:** `{prefix}-<name>.component.ts` (always `{prefix}-` prefix, kebab-case)

## `public-api.ts`

```typescript
export { {PascalPrefix}<Name>Component } from './{prefix}-<name>.component';
export type { <Name>Variant, <Name>Size } from './{prefix}-<name>.component';
```

## Reference: {prefix}-banner

```
{prefix}-banner/
├── {prefix}-banner.component.ts
├── {prefix}-banner.component.html
├── {prefix}-banner.component.scss
├── {prefix}-banner.component.spec.ts
├── index.ts
├── public-api.ts
└── {prefix}-banner.figma.ts
```

[{prefix}-banner]({dsComponentsRoot}/{prefix}-banner/)
