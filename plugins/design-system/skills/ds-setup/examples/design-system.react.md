# {name} — design-system conventions

How {name} builds components. Values (paths, prefix, token globs) live in
`.claude/design-system.json`; this doc never repeats them.

> Starting point for `/ds-setup`, React. Setup replaces every rule with what the repo does and
> keeps a rule unchanged only with evidence, or marked `(plugin default)`.

## Component shape

- Function components only; one root element carries `{selector}` and `{themeClass}` (when set)
  as classes.
- Variant/state classes and ARIA attributes are applied to the root element, never to an inner
  wrapper.
- `disabled` reflects as both a `disabled` class and `aria-disabled`.
- Components exposing a DOM node use `forwardRef`; stateless leaves are wrapped in `memo`.

```tsx
export const {ClassName} = forwardRef<HTMLDivElement, {ClassName}Props>(
  ({ variant = 'primary', disabled = false, ...rest }, ref) => (
    <div
      ref={ref}
      className={clsx('{selector}', '{themeClass}', variant, disabled && 'disabled')}
      aria-disabled={disabled}
      {...rest}
    />
  ),
);
```

Evidence: (plugin default)

## Types and exports

- Public types (`{Name}Variant`, `{ClassName}Props`, …) are defined in the component file and
  re-exported, never defined only at the barrel.
- `public-api.ts` exports the component(s) and types; `index.ts` is
  `export * from './public-api';`.

Evidence: (plugin default)

## File layout

```
{componentDir}/
├── {fileBase}.tsx
├── {fileBase}.module.css
├── {fileBase}.test.tsx
├── public-api.ts
├── index.ts
├── docs/
└── storybook/
```

Evidence: (plugin default)

## API conventions

- Named regions are typed `ReactNode` slot props (`title`, `actions`); `children` is the default
  slot. No child-type scanning or cloning.
- Behavior units are hooks: `use{Prefix}{Name}`.
- Parent/child families share state through a context; children read it optionally.
- Callbacks are `on{Event}`.

Evidence: (plugin default)

## Styling

- CSS Modules; the root class is the styling anchor.
- No `:global` except for documented third-party hooks.
- The override API is a set of `--{selector}-*` custom properties on the root, 5–7 at most,
  defaulting to DS tokens.
- `rem` for sizes; logical properties.

Evidence: (plugin default)

## Building blocks

Not established — discovery searches `{componentsRoot}` for icon, button and overlay components
per component.

## Storybook

- Stories live in `{componentPath}storybook/`, `{fileBase}.stories.tsx`, CSF3 `StoryObj`.

Evidence: (plugin default)

## Tests

- `{fileBase}.test.tsx` beside the component, Testing Library.
- Test logic only (derived state, guarded callbacks, observers, precedence, guards) — never class
  presence or static structure.

Evidence: (plugin default)

## Review rules

DS-specific only — the plugin's universal rules (API matches PRD, building blocks reused,
primitive wiring, token-only styling) apply on top.

1. **Component shape** — matches `## Component shape`.
2. **Type colocation** — per `## Types and exports`.
3. **Registration** — exported per `## Types and exports`.
4. **Styling** — matches `## Styling`: no `:global` outside documented hooks.

Evidence: (plugin default)
