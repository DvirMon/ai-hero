# Directives

Directives extend the behavior of DOM elements. Angular has three kinds: **attribute** (modify appearance/behavior), **structural** (manipulate the DOM tree), and **host directives** (compose behaviors).

> **FORBIDDEN in new code.** `@HostBinding` and `@HostListener` are legacy. Always use the `host` metadata property. `*ngIf`, `*ngFor`, `*ngSwitch` are legacy — use `@if`, `@for`, `@switch`.

---

## Same-Name Alias Convention

**The primary input of a directive must be aliased to the directive's selector name.**

This is the key DX convention for all Angular directives. It allows the consumer to pass the primary value inline — directly on the directive attribute — without needing a second attribute.

```html
<!-- ✅ Good — primary value passed inline on the directive itself -->
<p appHighlight="lightblue">Highlighted</p>
<p appHighlight>Default highlight</p>

<!-- ❌ Bad — forces consumer to write two attributes -->
<p appHighlight color="lightblue">Highlighted</p>
```

The pattern in code: alias the primary input to the selector name.

```ts
@Directive({ selector: '[appHighlight]' })
export class Highlight {
  // ✅ Alias matches selector — consumer writes appHighlight="value"
  color = input('yellow', { alias: 'appHighlight' });
}
```

**Rules:**
- Every directive that accepts a primary/configuring value **must** alias that input to the selector.
- Secondary inputs (modifiers, flags) keep their own names and are passed as separate attributes.
- If the directive has **no meaningful primary value** (e.g., pure behavior composites), no alias is needed.

### Structural Directive Alias Convention

The same rule applies to structural directives. Angular's microsyntax desugars
`*appLazyRender="expr"` into `[appLazyRender]="expr"` on the `<ng-template>`, so the
primary input must be aliased to the selector name for the shorthand syntax to work.

```ts
@Directive({ selector: '[appLazyRender]' })
export class LazyRender {
  // ✅ Alias matches selector — consumer writes *appLazyRender="condition()"
  condition = input.required<boolean>({ alias: 'appLazyRender' });
}
```

```html
<!-- ✅ Good — value passed inline on the structural directive -->
<div *appLazyRender="isTabActive()">
  <app-heavy-reports />
</div>

<!-- ❌ Bad — selector and input are decoupled; consumer has to look up the input name -->
<div *appLazyRender [condition]="isTabActive()">
  <app-heavy-reports />
</div>
```

---

## Attribute Directives

Modify element appearance or behavior using `host` bindings and signal inputs.

### Primary Input — Same-Name Alias

```ts
import { Directive, input, effect, inject, ElementRef } from '@angular/core';

@Directive({ selector: '[appHighlight]' })
export class Highlight {
  private el = inject(ElementRef<HTMLElement>);

  // Primary input aliased to selector name
  color = input('yellow', { alias: 'appHighlight' });

  constructor() {
    effect(() => {
      this.el.nativeElement.style.backgroundColor = this.color();
    });
  }
}

// Usage:
// <p appHighlight="lightblue">Highlighted text</p>   ← passes 'lightblue'
// <p appHighlight>Default yellow highlight</p>        ← uses default 'yellow'
```

### Primary Input + Secondary Inputs

When there are secondary modifier inputs alongside the primary, keep their own names:

```ts
@Directive({ selector: '[appTooltip]' })
export class Tooltip {
  // Primary input — aliased to selector
  text = input.required<string>({ alias: 'appTooltip' });

  // Secondary inputs — keep their own names
  position = input<'top' | 'bottom' | 'left' | 'right'>('top');
  delay = input(200);
}

// Usage:
// <button appTooltip="Click to save" position="bottom" [delay]="500">Save</button>
```

### Class Bindings in Directives

Prefer `[class.name]` for toggling known class names — it is explicit and composable:

```ts
@Directive({
  selector: '[appButton]',
  host: {
    'class': 'btn',
    '[class.btn-primary]': 'variant() === "primary"',
    '[class.btn-secondary]': 'variant() === "secondary"',
    '[class.disabled]': 'disabled()',
    '[attr.disabled]': 'disabled() || null',
  },
})
export class Button {
  // No single dominant value — no alias needed; all inputs are secondary modifiers
  variant = input<'primary' | 'secondary'>('primary');
  disabled = input(false, { transform: booleanAttribute });
}
// Usage: <button appButton variant="primary" [disabled]="isSaving()">Save</button>
```

Use `[class]` **only when the class name itself is dynamic**. Compute it with `computed()` — there can only be one `[class]` binding per directive:

```ts
@Directive({
  selector: '[appIcon]',
  host: { '[class]': 'hostClasses()' },
})
export class Icon {
  // Primary input — aliased to selector (the icon name IS the main value)
  name = input.required<string>({ alias: 'appIcon' });
  size = input<'sm' | 'md' | 'lg'>('md');

  protected hostClasses = computed(() => `icon icon-${this.name()} icon-${this.size()}`);
}
// Usage: <span appIcon="arrow-right" size="sm"></span>
```

### CSS Custom Properties

Bind CSS variables directly on the host via `[style.--var-name]`:

```ts
@Directive({
  selector: '[appTheme]',
  host: {
    '[style.--color-primary]': 'primary()',
    '[style.--color-accent]': 'accent()',
  },
})
export class Theme {
  // No single dominant value — no alias needed
  primary = input('blue');
  accent = input('green');
}
```

### Avoid `Renderer2` for Host CSS

> **FORBIDDEN for host styling.** Use `host` bindings — they are declarative and SSR-safe.

```ts
// ❌ NEVER write this for host element styling
effect(() => {
  this.renderer.setStyle(this.el.nativeElement, 'color', this.color());
});

// ✅ ALWAYS write this instead
@Directive({
  host: { '[style.color]': 'color()' },
})
```

`Renderer2` is still appropriate for **child elements** (e.g. dynamically created DOM nodes).

### Event Handling

```ts
@Directive({
  selector: '[appClickOutside]',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class ClickOutside {
  private el = inject(ElementRef<HTMLElement>);

  // No primary configuring value — pure behavior directive, no alias needed
  clickOutside = output<void>();

  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.clickOutside.emit();
    }
  }
}
// Usage: <div appClickOutside (clickOutside)="closeMenu()">...</div>
```

---

## Structural Directives

Use for DOM manipulation beyond control flow — portals, overlays, lazy rendering — and for **domain-logic conditionals** (role checks, permission gates, feature flags) where the condition is a reusable domain rule, not a plain boolean.

For plain boolean conditions and loops, always use native `@if`, `@for`, `@switch`.

The primary input **must** be aliased to the selector so Angular's `*` microsyntax works:

```ts
@Directive({ selector: '[appLazyRender]' })
export class LazyRender {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private rendered = false;

  // ✅ Primary input aliased to selector
  condition = input.required<boolean>({ alias: 'appLazyRender' });

  constructor() {
    effect(() => {
      if (this.condition() && !this.rendered) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.rendered = true;
      }
    });
  }
}
// Usage: <div *appLazyRender="isTabActive()"><app-heavy-reports /></div>
```

> For advanced structural directive patterns (Portal, Template Outlet with context, microsyntax), see [structural-directives.md](structural-directives.md).

---

## Host Directives

Compose reusable behaviors onto components or other directives without inheritance:

```ts
@Directive({
  selector: '[focusable]',
  host: {
    'tabindex': '0',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
    '[class.focused]': 'isFocused()',
  },
})
export class Focusable {
  isFocused = signal(false);
  onFocus() { this.isFocused.set(true); }
  onBlur() { this.isFocused.set(false); }
}

@Component({
  selector: 'app-custom-button',
  hostDirectives: [
    Focusable,
    { directive: Disableable, inputs: ['disabled'] },
  ],
  template: `<ng-content />`,
})
export class CustomButton {
  private disableable = inject(Disableable);
  clicked = output<void>();

  onClick() {
    if (!this.disableable.disabled()) this.clicked.emit();
  }
}
```

### Exposing Host Directive Outputs

```ts
@Component({
  selector: 'app-card',
  hostDirectives: [{ directive: Hoverable, outputs: ['hoverChange'] }],
  template: `<ng-content />`,
})
export class Card {}
// Usage: <app-card (hoverChange)="onHover($event)">...</app-card>
```

---

## Best Practices

- **Same-name alias**: Always alias the primary input to the selector name — for both attribute and structural directives.
- **Secondary inputs**: Keep secondary/modifier inputs at their natural name; don't alias them.
- **No primary value**: Omit the alias when the directive is pure behavior with no configuring value.
- Always use `host` metadata — never `@HostBinding` / `@HostListener`.
- Use `input()` and `output()` in directives just like components.
- Use `[class.name]` for known class names; `[class]` + `computed()` only when the name is dynamic.
- Use host directives to compose orthogonal behaviors instead of inheritance.
- **Domain-logic conditionals are valid structural directives** (role/permission/feature-flag checks). Plain booleans belong in `@if`, not in a directive.
- Never write structural directives for generic control flow — use `@if`, `@for`, `@switch`.
