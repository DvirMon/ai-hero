# Structural Directives

Structural directives manipulate the DOM by adding, removing, or rearranging elements using `TemplateRef` and `ViewContainerRef`.

**When to create a structural directive:**
- **Domain-logic conditionals** — role-based access, permission gates, feature flags. The directive encapsulates the domain check; the template stays clean.
- Portals — render content in a different DOM location
- Lazy rendering — defer heavy content until a condition is met
- Custom template outlets — render a `TemplateRef` with typed context

**When NOT to create a structural directive:**
- Generic boolean conditions → use `@if`
- Loops → use `@for`
- Switch-case → use `@switch`

The key distinction: **if the condition is domain logic** (role, permission, feature flag) that would otherwise be copy-pasted across many templates, wrap it in a structural directive. If it's just a plain `boolean`, use `@if`.

> See [directives.md](directives.md) for attribute and host directive patterns.

---

## Same-Name Alias Convention

The primary input **must always** be aliased to the directive's selector name. This is what makes the `*` microsyntax work cleanly:

```html
<!-- ✅ Consumer uses * shorthand — value passed inline -->
<div *appPortal="'body'">...</div>
<div *appLazyRender="isTabActive()">...</div>

<!-- ❌ Without alias the consumer must write two attributes -->
<ng-template appPortal [target]="'body'">...</ng-template>
```

Angular desugars `*appFoo="expr"` into:
```html
<ng-template [appFoo]="expr">...</ng-template>
```

So `[appFoo]="expr"` must bind to an input aliased `appFoo`.

Secondary inputs use the microsyntax `let` / `;name: value` syntax and keep their own names — no alias needed:

```html
<!-- Primary: appLazyRender="condition()" — aliased -->
<!-- Secondary: fallback — not aliased, accessed via "; fallback: ref" -->
<div *appLazyRender="isReady(); fallback: skeletonTpl">
  <app-content />
</div>
```

---

## Lazy Render

Render content once when a condition becomes `true`, then keep it rendered (no re-destruction):

```ts
import { Directive, input, effect, inject, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({ selector: '[appLazyRender]' })
export class LazyRender {
  private templateRef = inject(TemplateRef<void>);
  private viewContainer = inject(ViewContainerRef);
  private rendered = false;

  // Primary input aliased to selector
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
```

```html
<!-- ✅ Heavy component only created when tab is first opened -->
<div *appLazyRender="activeTab() === 'reports'">
  <app-heavy-reports />
</div>
```

---

## Lazy Render with Fallback

Extend the pattern with a secondary `fallback` template shown until the condition is met:

```ts
@Directive({ selector: '[appLazyRender]' })
export class LazyRender {
  private templateRef = inject(TemplateRef<void>);
  private viewContainer = inject(ViewContainerRef);
  private rendered = false;

  // Primary input aliased to selector
  condition = input.required<boolean>({ alias: 'appLazyRender' });

  // Secondary input — no alias; accessed via microsyntax "; fallback: tpl"
  fallback = input<TemplateRef<void> | null>(null);

  constructor() {
    effect(() => {
      if (this.condition()) {
        if (!this.rendered) {
          this.viewContainer.clear();
          this.viewContainer.createEmbeddedView(this.templateRef);
          this.rendered = true;
        }
      } else if (!this.rendered) {
        this.viewContainer.clear();
        const fb = this.fallback();
        if (fb) this.viewContainer.createEmbeddedView(fb);
      }
    });
  }
}
```

```html
<ng-template #skeleton><app-skeleton /></ng-template>

<div *appLazyRender="isReady(); fallback: skeleton">
  <app-content />
</div>
```

---

## Portal

Render a template's content in a different DOM location (e.g. at `<body>` level for modals):

```ts
import {
  Directive, input, inject, OnInit, OnDestroy,
  TemplateRef, ViewContainerRef, EmbeddedViewRef,
} from '@angular/core';

@Directive({ selector: '[appPortal]' })
export class Portal implements OnInit, OnDestroy {
  private templateRef = inject(TemplateRef<void>);
  private viewContainerRef = inject(ViewContainerRef);
  private viewRef: EmbeddedViewRef<void> | null = null;

  // Primary input aliased to selector — the target selector or element
  target = input<string | HTMLElement>('body', { alias: 'appPortal' });

  ngOnInit() {
    const container = this.resolveContainer();
    if (container) {
      this.viewRef = this.viewContainerRef.createEmbeddedView(this.templateRef);
      this.viewRef.rootNodes.forEach(node => container.appendChild(node));
    }
  }

  ngOnDestroy() {
    this.viewRef?.destroy();
  }

  private resolveContainer(): HTMLElement | null {
    const t = this.target();
    return typeof t === 'string' ? document.querySelector<HTMLElement>(t) : t;
  }
}
```

```html
<!-- ✅ Modal rendered at body level, outside the component DOM tree -->
<div *appPortal="'body'">
  <app-modal>Modal content</app-modal>
</div>

<!-- ✅ Portal to a named container -->
<div *appPortal="'#overlay-root'">
  <app-toast message="Saved!" />
</div>
```

---

## Template Outlet with Typed Context

Render a typed `TemplateRef` with a context object. Useful for building generic list, grid, or tree components that accept a custom item template:

```ts
export interface ItemContext<T> {
  $implicit: T;   // available as `let item` in the template
  index: number;  // available as `let i = index`
}

@Directive({ selector: '[appTemplateOutlet]' })
export class TemplateOutlet<T> {
  private viewContainer = inject(ViewContainerRef);
  private currentView: EmbeddedViewRef<ItemContext<T>> | null = null;

  // Primary input aliased to selector
  template = input.required<TemplateRef<ItemContext<T>>>({ alias: 'appTemplateOutlet' });

  // Secondary inputs
  context = input.required<T>({ alias: 'appTemplateOutletContext' });
  index = input(0, { alias: 'appTemplateOutletIndex' });

  constructor() {
    effect(() => {
      const tmpl = this.template();
      const ctx = this.context();
      const idx = this.index();

      if (this.currentView) {
        // Update context in place to avoid DOM re-creation
        this.currentView.context.$implicit = ctx;
        this.currentView.context.index = idx;
        this.currentView.markForCheck();
      } else {
        this.currentView = this.viewContainer.createEmbeddedView(tmpl, {
          $implicit: ctx,
          index: idx,
        });
      }
    });
  }
}
```

```html
<!-- Custom list component exposing a template slot -->
<ng-template #row let-item let-i="index">
  <tr><td>{{ i }}</td><td>{{ item.name }}</td></tr>
</ng-template>

<ng-container
  *appTemplateOutlet="row; context: item; index: i"
/>
```

---

## Domain-Logic Conditionals

Use a structural directive when the condition is a **reusable domain rule** — role-based access, permissions, feature flags — that would otherwise pollute every template that needs it.

This is the one valid case of a structural directive that wraps an `@if`-style operation. The directive owns the check; the template stays declarative.

### Role-Based Access (`*appHasRole`)

```ts
import { Directive, input, inject, TemplateRef, ViewContainerRef, effect } from '@angular/core';

@Directive({ selector: '[appHasRole]' })
export class HasRole {
  private templateRef = inject(TemplateRef<void>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  // Primary input aliased to selector — the role (or roles) to check
  role = input.required<string | string[]>({ alias: 'appHasRole' });

  // Secondary input — optional fallback template shown when access is denied
  else = input<TemplateRef<void> | null>(null);

  constructor() {
    effect(() => {
      const allowed = this.authService.hasRole(this.role());

      this.viewContainer.clear();

      if (allowed) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        const fallback = this.else();
        if (fallback) this.viewContainer.createEmbeddedView(fallback);
      }
    });
  }
}
```

```html
<!-- ✅ Show content only to admins -->
<button *appHasRole="'admin'" (click)="deleteUser()">Delete</button>

<!-- ✅ Multiple roles accepted -->
<app-dashboard *appHasRole="['admin', 'manager']" />

<!-- ✅ With else fallback -->
<ng-template #noAccess>
  <p>You do not have permission to view this.</p>
</ng-template>

<app-settings *appHasRole="'admin'; else: noAccess" />
```

The `AuthService` owns the role logic — the directive just bridges it to the template:

```ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly $currentUser = signal<User | null>(null);

  hasRole(role: string | string[]): boolean {
    const user = this.$currentUser();
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => user.roles.includes(r));
  }
}
```

### Permission-Based Access (`*appIfPermission`)

Same pattern for fine-grained permissions:

```ts
@Directive({ selector: '[appIfPermission]' })
export class IfPermission {
  private templateRef = inject(TemplateRef<void>);
  private viewContainer = inject(ViewContainerRef);
  private permissionsService = inject(PermissionsService);

  // Primary input aliased to selector
  permission = input.required<string>({ alias: 'appIfPermission' });

  constructor() {
    effect(() => {
      this.viewContainer.clear();
      if (this.permissionsService.can(this.permission())) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
```

```html
<button *appIfPermission="'tickets.delete'" (click)="deleteTicket()">Delete</button>
<app-billing *appIfPermission="'billing.view'" />
```

### Why Not Just Use `@if`?

```html
<!-- ❌ Without directive — domain logic leaks into every template -->
@if (authService.hasRole('admin') && !authService.isReadonly()) {
  <button (click)="deleteUser()">Delete</button>
}

<!-- ✅ With directive — template stays declarative -->
<button *appHasRole="'admin'" (click)="deleteUser()">Delete</button>
```

The structural directive encapsulates the domain rule once. Templates become self-documenting and the access logic lives in one place.

---

## Microsyntax Reference

Angular's `*` microsyntax desugars to `<ng-template>` bindings:

| Shorthand | Desugared |
|-----------|-----------|
| `*appFoo="expr"` | `<ng-template [appFoo]="expr">` |
| `*appFoo="expr; bar: val"` | `<ng-template [appFoo]="expr" [appFooBar]="val">` |
| `*appFoo="expr; let x"` | `<ng-template [appFoo]="expr" let-x>` |
| `*appFoo="expr; let x = idx"` | `<ng-template [appFoo]="expr" let-x="idx">` |

Secondary inputs in microsyntax are prefixed with the directive selector:
`; bar: val` → `[appFooBar]="val"` — so the input must be named `appFooBar` (or aliased to it).

---

## Best Practices

- **Always alias the primary input** to the selector name so the `*` shorthand works.
- Secondary inputs use `; name: value` microsyntax — prefix them with the selector in the alias if needed.
- Prefer `effect()` over `ngOnChanges` for reacting to input changes.
- Call `viewContainer.clear()` before re-rendering to avoid stale views.
- Implement `OnDestroy` (or use `DestroyRef`) to destroy embedded views and prevent memory leaks.
- **Domain-logic conditionals are valid** — role checks, permission gates, feature flags belong in structural directives.
- Never write structural directives for plain boolean conditions or loops — use `@if`, `@for`.
