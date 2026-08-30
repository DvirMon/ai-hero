# Component Class — Angular Examples

> Conventions and rules live in `component-class.md` (agnostic). This file is Angular syntax only.

> Replace `{PREFIX}` with your component prefix (e.g., `atera`, `my`, `app`). Replace `<Name>` with the component name (e.g., `Card`, `Stepper`).

## Required Structure

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type <Name>Variant = 'primary' | 'secondary';
export type <Name>Size = 'sm' | 'md' | 'lg';

@Component({
  selector: '{prefix}-<name>',
  imports: [],
  templateUrl: './{prefix}-<name>.component.html',
  styleUrl: './{prefix}-<name>.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': '{prefix}-<name> {prefix}-theme-element',
    '[class.primary]': 'variant() === "primary"',
    '[class.secondary]': 'variant() === "secondary"',
    '[class.disabled]': 'disabled()',
    '[attr.aria-disabled]': 'disabled()',
  }
})
export class {PascalPrefix}<Name>Component {
  variant = input<<Name>Variant>('primary');
  size = input<<Name>Size>('md');
  disabled = input(false);

  someEvent = output<void>();
}
```

## Angular-Specific Notes

### Theme element class in `host`

```typescript
host: {
  'class': '{prefix}-<name> {prefix}-theme-element',
}
```

### Variant classes in `host`, not the template

```typescript
// GOOD: declared in host
host: {
  '[class.primary]': 'variant() === "primary"',
  '[class.danger]': 'variant() === "danger"',
}
```

```html
<!-- BAD: class binding in template -->
<div [class.primary]="variant() === 'primary'">
```

This keeps `:host` as the single styling root — no wrapper divs needed.

### Types defined in the component file

Define all public types in the `.component.ts` file, then re-export them from `public-api.ts`. Never define types only in `public-api.ts`.

### `ChangeDetectionStrategy.OnPush` is non-negotiable

All DS components use `OnPush`. No exceptions.

### Do not add `standalone: true`

It is the default in Angular 19. Explicit `standalone: true` is redundant noise.

### No `NgModule`

All DS components are standalone. Never wrap in or declare inside an `NgModule`.
