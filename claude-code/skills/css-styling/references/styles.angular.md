# Styles — Angular Conventions

> Agnostic conventions (tokens, Tailwind, layouts, override-API pattern, logical CSS, DS rules) are split across `references/*.md` — see `SKILL.md`'s Topics table. This file covers Angular-specific style encapsulation and binding syntax only. Token names in examples are illustrative — resolve real names per [tokens.md](tokens.md).

## Renderer2 in Directives — Use host Bindings Instead

Never use `Renderer2` to manipulate styles or classes on a directive's own host element. Use the `host` property in `@Directive` instead:

```typescript
// BAD: Renderer2 for host element styling
export class BadDirective {
  private renderer = inject(Renderer2);
  private el = inject(ElementRef);

  constructor() {
    this.renderer.setStyle(this.el.nativeElement, 'color', 'red');
    this.renderer.addClass(this.el.nativeElement, 'active');
  }
}

// GOOD: Declarative host bindings
@Directive({
  selector: '[appHighlight]',
  host: {
    '[style.color]': 'color()',
    '[class.active]': 'isActive()',
  },
})
export class GoodDirective {
  color = input('red');
  isActive = input(false);
}
```

`Renderer2` is still valid for manipulating **child/dynamic DOM nodes** that are not the directive's own host element.

## View Encapsulation & ::ng-deep

### Default: Emulated Encapsulation (KEEP IT)

**Never default to `ViewEncapsulation.None` for new components.** Use Angular's default `Emulated` encapsulation.

```typescript
// BAD: Don't add ViewEncapsulation.None by default
@Component({
  encapsulation: ViewEncapsulation.None,  // Anti-pattern
})

// GOOD: Use default Emulated (don't even specify it)
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // No encapsulation property = Emulated by default
})
```

**Only use `ViewEncapsulation.None` if:** testing proves styles genuinely don't apply after portaling through a CDK overlay or similar — and investigate the root cause first.

### Styling `<ng-content>`-projected markup: directive-per-part first

A component can't reach content a consumer projects in with a normal descendant selector —
emulated encapsulation stamps projected nodes with the *consumer's* id, not the projecting
component's, so `:host h3 { ... }` never matches. `ViewEncapsulation.None` is not the default fix:

- **Structured content (fixed part-set)** — give each part its own attribute-hosted component
  (e.g. `h3[fooTitle]`, `p[fooText]`) that styles only its own `:host`. Stays under default
  Emulated encapsulation, zero global-scope leak risk. Prefer this whenever the projected shape
  is known ahead of time (a card's title+body, a list item's label+meta).
- **Arbitrary content (no fixed part-set)** — e.g. rich text where the consumer can author any
  heading level, lists, links, inline code — a directive per possible element isn't practical.
  `ViewEncapsulation.None` is justified here, but every selector in that stylesheet must be
  scoped under the component's own host *class* (not `:host`, which stops working under `None`)
  so the global-scope rules can't leak into the rest of the app.

Reach for `None` only after confirming the content is genuinely open-ended — not just because
directive-per-part feels like more ceremony for two elements.

### Using ::ng-deep Safely (App-Level Components Only)

```scss
/* BAD: Affects all components globally */
::ng-deep h3 {
  font-style: italic;
}

/* GOOD: Scoped with :host */
:host ::ng-deep h3 {
  font-style: italic;
}
```

**Rule:** Always prefix `::ng-deep` with `:host` to prevent style bleed.

### DS Components: No `::ng-deep` — Ever

Per [ds-components.md](ds-components.md), this is stricter than the app-level rule above. A DS component never uses `::ng-deep`, not even scoped with `:host`. Expose a CSS custom property instead:

```scss
// BAD: piercing encapsulation
:host ::ng-deep .child-element { color: red; }

// GOOD: expose a CSS variable, let the child consume it
:host {
  --icon-color: var(--role-token-content-danger);
}
// In the child component's own SCSS:
// :host { color: var(--icon-color, var(--role-token-content-default)); }
```

## Root Selector

### App-level components

Style the component's root normally (host or a top-level class) — no special constraint beyond the encapsulation rules above.

### DS components: `:host` as Root

Style `:host` directly — never add a wrapper `<div>` just for styling.

```scss
// GOOD
:host {
  display: flex;
  align-items: center;
  border-radius: var(--role-token-radius-md);
}

// BAD: wrapper div for styling purposes
// .wrapper { display: flex; ... }
```

## Component Token Override API — Angular Syntax

```scss
:host {
  // Consumer-overridable tokens — name is illustrative
  --component-bg: var(--role-token-fill);
  --component-color: var(--role-token-content);

  // Structural styles consume the tokens
  background: var(--component-bg);
  color: var(--component-color);
}
```

## Translations

Verify the project's actual i18n library before assuming this syntax (e.g. `@ngx-translate/core`):

```html
<!-- BAD: Hardcoded text -->
<button>Save Changes</button>

<!-- GOOD: Translated -->
<button>{{ 'common.save_changes' | translate }}</button>
```

## Accessibility — Angular Binding Syntax

```html
<input
  id="email"
  aria-describedby="email-error"
  [class.error]="emailInvalid()">
<span id="email-error" *ngIf="emailInvalid()">
  {{ 'errors.invalid_email' | translate }}
</span>
```
