# Error Boundaries with `@boundary`

> **Developer Preview** — available in Angular v22. API may change before stable.

`@boundary` wraps template sections to isolate component failures. An error in any child component is caught at the boundary; the `@error` fallback renders instead of crashing the page.

## Syntax

```html
@boundary {
  <app-checkout-widget />
} @error (let err) {
  <app-fallback-widget [error]="err" />
}
```

- `@boundary` — the protected region; any error thrown by child components is caught here
- `@error (let err)` — fallback content; `err` is the caught error object

## When to Use

Use `@boundary` around components that:
- Fetch external data independently (third-party widgets, promo banners)
- Are maintained by different teams and may throw unexpectedly
- Live inside a high-stakes flow (checkout, auth) where a single failure must not break the page

## What It Catches

Errors that bubble up through child components inside the block — including errors in child lifecycle hooks, template expressions, and event handlers.

## What It Does NOT Catch

- Errors thrown by the host component itself (only children are isolated)
- Framework-level errors outside the template

## Multiple Boundaries

Nest or stack boundaries to isolate independent sections:

```html
@boundary {
  <app-sidebar />
} @error {
  <app-sidebar-placeholder />
}

@boundary {
  <app-main-content />
} @error {
  <p>Content unavailable. Please refresh.</p>
}
```

## Accessing the Error

The `@error` block receives the caught error via `let err`:

```html
@boundary {
  <risky-component />
} @error (let err) {
  <p>Something went wrong: {{ err.message }}</p>
}
```
