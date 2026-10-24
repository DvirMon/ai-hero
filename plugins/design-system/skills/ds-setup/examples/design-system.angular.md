# {name} — design-system conventions

How {name} builds components. Values (paths, prefix, token globs) live in
`.claude/design-system.json`; this doc never repeats them.

> Starting point for `/ds-setup`, Angular. Setup replaces every rule with what the repo does and
> keeps a rule unchanged only with evidence, or marked `(plugin default)`.

## Component shape

- Root is the host element: `@Component({ selector: '{selector}' })`.
- `host.class` carries `{selector}` and `{themeClass}` (when set).
- Variant/state classes and ARIA attributes bind in `host`, never in the template — `:host`
  stays the single styling root.
- `disabled` reflects as both `[class.disabled]` and `[attr.aria-disabled]`.
- `changeDetection: ChangeDetectionStrategy.OnPush`. No explicit `standalone: true`, no
  `NgModule`.
- Signal APIs: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`; `inject()` over
  constructor injection; host listeners via `host`, never `@HostListener`.

```typescript
@Component({
  selector: '{selector}',
  templateUrl: './{fileBase}.html',
  styleUrl: './{fileBase}.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: '{selector} {themeClass}',
    '[class.primary]': 'variant() === "primary"',
    '[class.disabled]': 'disabled()',
    '[attr.aria-disabled]': 'disabled()',
  },
})
export class {ClassName} {
  readonly variant = input<{Name}Variant>('primary');
  readonly disabled = input(false);
}
```

Evidence: (plugin default)

## Types and exports

- Public types (`{Name}Variant`, `{Name}Size`, …) are defined in the component file and
  re-exported, never defined only at the export layer.
- `public-api.ts` exports the class(es) and types; `index.ts` is `export * from './public-api';`.
- A multi-part family also exports a convenience array (`export const {Prefix}Stepper = [...]
  as const`) beside the individual exports.

Evidence: (plugin default)

## File layout

```
{componentDir}/
├── {fileBase}.ts
├── {fileBase}.html
├── {fileBase}.scss
├── {fileBase}.spec.ts
├── public-api.ts
├── index.ts
├── docs/
└── storybook/
```

Evidence: (plugin default)

## API conventions

- Named slots use attribute selectors: `<ng-content select="[{prefix}CardTitle]" />`.
- Behavior units are directives with a camelCase attribute selector: `[{prefix}Autosize]`.
- Parent/child families share state through an `InjectionToken` (`{PREFIX}_CARD`), children
  inject it optionally.
- Form controls integrate through `ControlValueAccessor` (or Signal Forms when the DS has
  adopted them).

Evidence: (plugin default)

## Styling

- Styles target `:host`; no wrapper element exists only for styling.
- No `::ng-deep`; a child is influenced through a custom property.
- `ViewEncapsulation.None` only for genuinely arbitrary projected content, every selector then
  scoped under `{selector}`.
- The override API is a set of `--{selector}-*` custom properties on `:host`, 5–7 at most,
  defaulting to DS tokens.
- `rem` for sizes; logical properties.

Evidence: (plugin default)

## Building blocks

Not established — discovery searches `{componentsRoot}` for icon, button and overlay components
per component.

## Storybook

Not a section of this doc — story conventions live in the file the DS project's
`.claude/story.json` entry names at `docs.conventions` (written via `/story:setup`).

## Tests

- `{fileBase}.spec.ts` beside the component.
- Test logic only (computed state, guarded outputs, observers, precedence, guards) — never
  class presence, projection or static structure.
- Drive inputs with `fixture.componentRef.setInput(...)`.

Evidence: (plugin default)

## Review rules

DS-specific only — the plugin's universal rules (API matches PRD, building blocks reused,
primitive wiring, token-only styling) apply on top.

1. **Component shape** — matches `## Component shape`.
2. **Type colocation** — per `## Types and exports`.
3. **Template hygiene** — no method call in a non-event binding to compute a render value
   (`computed()` or `@let`).
4. **Registration** — exported per `## Types and exports`.
5. **Styling** — matches `## Styling`: no `::ng-deep`, justified `ViewEncapsulation.None`.

Evidence: (plugin default)
