# Component API Design — Angular Examples

> Guideline, principle, and pattern-selection decision tree live in `component-api.md` (agnostic). This file is Angular syntax only, mapped to that file's pattern numbers.

> Replace `{PREFIX}` with your component prefix (e.g., `atera`, `my`, `app`). Replace `{PascalPrefix}` with PascalCase version (e.g., `Atera`, `My`, `App`).

## Pattern 1 — Directive-as-feature

The directive reads from / writes to the host element via `inject(ElementRef)` or the `host` property. It never renders its own template.

**Examples:** `[{prefix}Autosize]` on `<textarea>`, `[{prefix}Autocomplete]` on `<input>`, `[{prefix}Editable]` on any heading.

---

## Pattern 2 — Portal-based content

Check the codebase researcher output for internal overlay/portal wrappers first — use them before reaching for raw `@angular/cdk/portal` or `@angular/cdk/overlay`.

---

## Pattern 3 — Trigger + panel

```html
<input [{prefix}Autocomplete]="panel" />
<{prefix}-autocomplete-panel #panel>...</{prefix}-autocomplete-panel>
```

---

## Pattern 4 — Composable sub-components

Parent provides itself as a token; children inject it.

```typescript
// Parent
@Component({
  selector: '{prefix}-card',
  providers: [{ provide: {PREFIX_UPPER}_CARD, useExisting: {PascalPrefix}CardComponent }]
})
export class {PascalPrefix}CardComponent {
  readonly items = signal<{PascalPrefix}CardItemComponent[]>([]);
  register(item: {PascalPrefix}CardItemComponent): void { this.items.update(i => [...i, item]); }
}

// Child injects parent — no direct import coupling
@Component({ selector: '{prefix}-card-title' })
export class {PascalPrefix}CardTitleComponent {
  private readonly card = inject({PREFIX_UPPER}_CARD, { optional: true });
  constructor() { this.card?.register(this); }
}
```

```html
<{prefix}-card>
  <{prefix}-card-title>Budget Overview</{prefix}-card-title>
  <{prefix}-card-label color="success">+12%</{prefix}-card-label>
</{prefix}-card>
```

Export all sub-components from `public-api.ts` — they are independently usable.

---

## Pattern 5a — Simple ng-content

```html
<div class="container"><ng-content /></div>
```

---

## Pattern 5b — Named slots

Prefer attribute selectors over element selectors.

```html
<!-- Component template -->
<div class="header"><ng-content select="[{prefix}CardTitle]" /></div>
<div class="body"><ng-content /></div>
<div class="actions"><ng-content select="[{prefix}CardActions]" /></div>

<!-- Consumer -->
<{prefix}-card>
  <span {prefix}CardTitle>My Title</span>
  <p>Rich content including <{prefix}-icon-2 key="info" /></p>
  <button {prefix}CardActions {prefix}-button>Save</button>
</{prefix}-card>
```

---

## Figma Variant → Angular Input Mapping

| Figma variant | Angular pattern |
|---|---|
| Enum (`Type=Primary,Secondary`) | `appearance = input<Appearance>('primary')` |
| Boolean toggle (`Show icon=True/False`) | `showIcon = input(false)` |
| Static label / title | `<ng-content select="[slot=title]" />` |
| Variable body content | `<ng-content />` |
| Action buttons / links | `<ng-content select="[slot=actions]" />` |
| Color/intent (`Color=Danger,Success`) | `color = input<Color>('neutral')` |
| Hover/focus state | CSS pseudo-class — not an input |
| Disabled state | `disabled = input(false)` |

---

## Public API Exports

### Simple component

```typescript
export { {PascalPrefix}BadgeComponent } from './{prefix}-badge.component';
export type { BadgeVariant, BadgeSize } from './{prefix}-badge.component';
```

### Multi-atomic family (Pattern 4)

```typescript
export { {PascalPrefix}StepperComponent }        from './{prefix}-stepper.component';
export { {PascalPrefix}StepComponent }           from './{prefix}-step.component';
export { {PascalPrefix}StepperLabelDirective }   from './{prefix}-stepper-label.directive';
export type { StepperOrientation }      from './{prefix}-stepper.component';

export const {PascalPrefix}Stepper = [
  {PascalPrefix}StepperComponent,
  {PascalPrefix}StepComponent,
  {PascalPrefix}StepperLabelDirective,
] as const;
```
