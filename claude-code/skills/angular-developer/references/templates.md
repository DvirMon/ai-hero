# Templates

Angular templates define the view for a component. Always use modern template syntax — built-in control flow, native bindings, signal queries, and `@let` for local derivation.

## Control Flow

Use the built-in control flow syntax (`@if`, `@for`, `@switch`) instead of structural directives.

> **FORBIDDEN in new code.** `*ngIf`, `*ngFor`, `*ngSwitch` are legacy. Always use `@if`, `@for`, `@switch`.

```html
<!-- ❌ NEVER write this -->
<section *ngIf="isVisible">Content</section>
<section *ngFor="let item of items">{{ item }}</section>

<!-- ✅ ALWAYS write this -->
@if (isVisible) {
  <section>Content</section>
}
@for (item of items; track item.id) {
  <section>{{ item }}</section>
}
```

**Always include `track` in `@for` loops** for performance and correct change detection.

### `@if` — result aliasing

Save the expression result to avoid re-calling a signal.

```html
@if (user.settings(); as settings) {
  <p>Theme: {{ settings.theme }}</p>
}
```

Use `@else if` and `@else` for multi-branch conditionals.

```html
@if (user.isAdmin) {
  <admin-dashboard />
} @else if (user.isModerator) {
  <mod-dashboard />
} @else {
  <standard-dashboard />
}
```

### `@for` — implicit variables and `@empty`

Available implicit variables: `$index`, `$count`, `$first`, `$last`, `$even`, `$odd`.

```html
<ul>
  @for (item of items(); track item.id; let i = $index, total = $count) {
    <li>{{ i + 1 }}/{{ total }}: {{ item.name }}</li>
  } @empty {
    <li>No items to display.</li>
  }
</ul>
```

### `@switch` — no fallthrough, exhaustive checking

Uses strict equality (`===`), no fallthrough.

```html
@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error')   { <app-error-msg /> }
  @case ('success') { <app-data-grid /> }
  @default { <p>Unknown status</p> }
}
```

**Multiple conditions per block** (v22+) — consecutive `@case` statements share one body:

```html
@switch (role()) {
  @case ('admin')
  @case ('superuser') {
    <app-admin-panel />
  }
  @default { <app-user-panel /> }
}
```

Use `@default never` to enforce exhaustive union handling — Angular errors if a new union member is added without a matching `@case`.

```html
@switch (state) {
  @case ('on')  { ... }
  @case ('off') { ... }
  @default never;
}
```

## Local Variables with `@let`

Use `@let` to derive and reuse local values in templates without moving logic to the class.

```html
<!-- Reusing signal results -->
@let user = user();
<h1>{{ user.name }}</h1>
<p>{{ user.email }}</p>

<!-- Form control subtrees -->
@let controls = form.controls;
<input [formControl]="controls.name" />

<!-- Async pipe results -->
@let user = user$ | async;
@if (user) {
  <app-user-card [user]="user" />
}
```

**Use `@let` for:**
- Reusing signal call results
- Accessing nested object properties
- Form control subtrees
- View-only derivation not worth a `computed()`

**Do not use `@let` for:** business logic, heavy computation, or complex transformations — move those to TypeScript.

**Never add a `protected` method purely to compute a render value** (e.g. `isSelected(item)`, `getLabel(item)`) — a method call in an interpolation/attribute/property binding re-runs every change-detection check and hides render logic behind an opaque call site. Only class methods triggered by an event binding (`(click)="activate(item)"`) belong in a template as calls.

```html
<!-- ❌ render logic behind a method call -->
<button [attr.aria-selected]="isSelected(tab)">

<!-- ✅ no per-item param, no reuse across bindings: computed() -->
<button [attr.aria-selected]="isSelected()">

<!-- ✅ per-item param inside @for, or reused across multiple bindings on the same row: @let -->
@for (tab of items(); track tab.id) {
  @let isSelected = tab.id === selected();
  <button [attr.aria-selected]="isSelected" [attr.data-active]="isSelected ? '' : null">
}

<!-- ✅ trivial one-off, no reuse: inline expression, no method, no @let -->
<button [attr.aria-selected]="tab.id === selected()">
```

## Class Bindings

> **FORBIDDEN in new code.** `[ngClass]` is legacy. Use native `[class.*]` bindings.

```html
<!-- ❌ NEVER write this -->
<div [ngClass]="{ 'active': isActive, 'disabled': isDisabled }"></div>

<!-- ✅ ALWAYS write this -->
<div [class.active]="isActive" [class.disabled]="isDisabled"></div>
<div [class]="{ active: isActive }"></div>
```

## Style Bindings

> **FORBIDDEN in new code.** `[ngStyle]` is legacy. Use native `[style.*]` bindings.

```html
<!-- ❌ NEVER write this -->
<div [ngStyle]="{ 'font-size': size + 'px' }"></div>

<!-- ✅ ALWAYS write this -->
<div [style.font-size.px]="size"></div>
<div [style.color]="color"></div>
```

## Form Control Access

Always access reactive form controls using `.controls` in templates for type safety.

```html
<!-- ✅ ALWAYS write this -->
<input [formControl]="form.controls.name" />
<input [formControl]="form.controls.items.controls[i].controls.model" />

<!-- ❌ NEVER write this -->
<input [formControl]="form.get('name')" />
```

> For signal-based and decorator-based query APIs (`viewChild`, `viewChildren`, `contentChild`, `contentChildren`), see [components.md](components.md).

## Version-Gated Features

### Spread Syntax in Templates (v21.1+)

Use spread syntax in templates only in Angular v21.1 and later.

```html
<!-- ✅ v21.1+ only -->
@let allUsers = [...admins(), ...users()];
@let config = { ...baseConfig, disabled: isSaving() };
```

### Arrow Functions in Template Expressions (v21.2+)

Use arrow functions in templates only in Angular v21.2 and later.

```html
<!-- ✅ v21.2+ only — small inline callbacks only -->
<app-grid [compareWith]="(a, b) => a.id === b.id" />
```

### `instanceof` in Template Expressions (v21.2+)

Use `instanceof` in templates only in Angular v21.2 and later.

```html
<!-- ✅ v21.2+ only — simple type narrowing only -->
@if (value instanceof Error) {
  <app-error [error]="value" />
}
```

## Images — `NgOptimizedImage`

Always use `NgOptimizedImage` instead of a plain `<img>` tag. It enforces performance best practices and prevents layout shifts.

```ts
import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage],
  ...
})
```

### Basic usage

Replace `src` with `ngSrc`. `width` and `height` are required (prevents CLS).

```html
<!-- ❌ NEVER write this -->
<img src="/hero.jpg" />

<!-- ✅ ALWAYS write this -->
<img ngSrc="/hero.jpg" width="800" height="600" alt="Hero" />
```

### LCP images — `priority`

Mark the Largest Contentful Paint image with `priority`. This sets `fetchpriority=high`, `loading=eager`, and adds a preload hint for SSR. Angular warns in dev if LCP images are missing this attribute.

```html
<img ngSrc="/hero.jpg" width="800" height="600" priority alt="Hero" />
```

### Fill mode

Use `fill` when the image should fill its container and you can't specify fixed dimensions. The parent must have `position: relative | fixed | absolute`.

```html
<div style="position: relative; width: 100%; height: 400px;">
  <img ngSrc="/banner.jpg" fill alt="Banner" style="object-fit: cover;" />
</div>
```

### Responsive images with `sizes`

Set `sizes` for responsive images — the directive generates an optimised `srcset` automatically.

```html
<img ngSrc="/photo.jpg" width="1200" height="800" sizes="100vw" alt="Photo" />
<!-- For partial-width images -->
<img ngSrc="/card.jpg" width="400" height="300" sizes="(max-width: 768px) 100vw, 50vw" alt="Card" />
```

### CDN loaders

Register a built-in loader (Cloudflare, Cloudinary, ImageKit, Imgix, Netlify) in `app.config.ts`:

```ts
import { provideCloudflareLoader } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCloudflareLoader('https://mysite.cloudflareimages.com'),
  ],
};
```

Custom loader via `IMAGE_LOADER` token:

```ts
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';

{ provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) =>
    `https://cdn.example.com/${config.src}?w=${config.width}` }
```

### Guidelines

- Always provide `alt` text.
- Always set `width` + `height` or use `fill` — never omit both.
- Mark the LCP image with `priority`.
- Use `sizes` for fluid/responsive images to enable automatic `srcset`.
- Avoid `<picture>` — not supported by `NgOptimizedImage`.

## Minimal DOM Nesting

**Rule: Pass styling via `[class]` binding directly to components instead of wrapping in extra `<div>`s.**

### Prefer `:host` over a wrapper `<div>` for the outer layout container

If the layout container spans the whole template, put `display: grid`/`flex` on `:host` — no wrapper div at all:

```css
/* component.css */
:host {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

```html
<!-- no outer div needed -->
<app-eyebrow [class]="classes.leftColumn" />
<app-heading level="3" [class]="classes.rightColumn" />
```

### Use wrapper `<div>` only for a sub-grouping inside the template

Justified only when a subset of children need their own nested container that doesn't map to `:host` or any component boundary:

```html
<!-- ✓ Good — :host is already the grid; inner div groups just the right column -->
<app-eyebrow [class]="classes.leftColumn" />
<div [class]="classes.rightColumn">
  <app-heading level="3">{{ title }}</app-heading>
  <app-body>{{ description }}</app-body>
</div>
```

### Anti-pattern: wrapper-only divs

```html
<!-- ✗ Bad — div only applies margin, not layout -->
<div [class]="classes.spacing">
  <app-eyebrow>{{ marker }}</app-eyebrow>
</div>

<!-- ✓ Fix — pass class binding to component -->
<app-eyebrow [class]="classes.spacing">{{ marker }}</app-eyebrow>
```

### Checklist before adding `<div>`

- Does this container span the *whole* template? → use `:host`, no div.
- Does it group only a *subset* of children with no matching component boundary? → div justified.
- Is it just wrapping one component for styling? → use `[class]` binding instead, no div.

### Component host styling alternative

If the component owns the spacing, use `:host` in component CSS:

```css
:host.spacing {
  display: block;
  margin-bottom: 0.75rem;
}
```

```html
<app-heading class="spacing" level="3">{{ title }}</app-heading>
```

## Decompose Long Templates into Sub-Components

Same test as extracting logic (see project rule `extract-encapsulated-logic.md`): does this
markup block have its own shape, state, or reasoning separable from its host? Reuse potential
is not the test — a block used once still earns its own component if it has its own scope.

**Signals to extract:**
- Repeated `@for`/`@if` cell with internal structure (a row, a card, a grid item) — own component or `ng-template`.
- A section with its own local state (`@let`, a `computed`, a toggled flag) that the rest of the template never touches.
- A block that would need a comment to explain what it renders — the comment belongs in the component's name instead.
- A distinct responsibility region (toolbar, header, footer, filter bar) independently testable/reasoned about without the rest of the template.

**Don't extract when:**
- The block is a couple of elements with no independent shape or state.
- Extraction requires passing back most of the host's state anyway — no real seam exists.

**Guard against over-extraction.** Net reading cost is the test, not length alone. A component
whose template is now 5 lines that each say "see `<app-x>`" is worse DX than one host template
you can read top-to-bottom — extraction traded a name for a jump, and the jump wasn't worth it.
If the block has no state/lifecycle of its own and needs most of the host's context passed back
in as inputs, it never had its own scope; keep it inline. When in doubt, default to inline.

```html
<!-- ✗ Bad — row shape inlined, template grows unbounded per feature -->
@for (item of items(); track item.id) {
  <div class="row">
    <span [class]="statusClass(item)">{{ item.status }}</span>
    <span>{{ item.name }}</span>
    <button (click)="onItemRemoveClick(item)">Remove</button>
  </div>
}

<!-- ✓ Good — row is its own component, host template stays scannable -->
@for (item of items(); track item.id) {
  <app-item-row [item]="item" (remove)="onItemRemoveClick($event)" />
}
```

File placement follows `file-organization.md`: a component with its own inputs/outputs gets its
own file; a one-off structural split with no state of its own can stay as a named `ng-template`
in the same file.

## General Principles

- Keep templates simple — move business logic to TypeScript.
- Prefer `@let` and template expressions for view-only derivation.
- Use `.controls` for reactive form access.
- Always use built-in control flow and native bindings.
- Never use `ngClass`, `ngStyle`, `*ngIf`, `*ngFor`, or decorator-based queries.
