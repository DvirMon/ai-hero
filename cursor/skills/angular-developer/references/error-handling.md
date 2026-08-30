# Error Handling

Angular error handling has three layers. Use the most localized layer that fits; escalate only when needed.

## Layer 1 — Template Isolation (`@boundary`)

Isolate child component failures without crashing the page. See [boundary.md](boundary.md) for full syntax.

```html
@boundary {
  <app-checkout-widget />
} @error (let err) {
  <p>Checkout unavailable: {{ err.message }}</p>
}
```

Use for: third-party widgets, team-boundary components, high-stakes flows.

## Layer 2 — Localized Handling (call-site first)

**Principle:** surface errors at the call site whenever possible. Enables contextual recovery.

### HTTP / async — `catchError`

```ts
this.http.get('/api/data').pipe(
  catchError(err => {
    this.errorMsg.set(err.message);
    return EMPTY;
  })
).subscribe();
```

### Imperative code — `try/catch`

```ts
async loadData() {
  try {
    this.data.set(await this.dataService.fetch());
  } catch (err) {
    this.error.set(err);
  }
}
```

**What Angular catches for you** (no try/catch needed):
- Errors from lifecycle hooks and constructors
- Errors from `AsyncPipe`
- Errors from `PendingTasks.run`

**What Angular does NOT catch** (you must handle):
- Direct synchronous method calls
- Errors returned as state values (e.g. `resource()` error signal)

## Layer 3 — Global Handler (`ErrorHandler`)

Reserve for unexpected/fatal errors and logging infrastructure. Not a substitute for localized handling.

```ts
export class GlobalErrorHandler implements ErrorHandler {
  private readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);

  handleError(error: unknown) {
    const url = this.router.url;
    const message = (error as Error)?.message ?? 'unknown';

    this.analytics.trackEvent({
      eventName: 'exception',
      description: `Screen: ${url} | ${message}`,
    });

    console.error(GlobalErrorHandler.name, { error });
  }
}
```

Register in `app.config.ts`:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideBrowserGlobalErrorListeners(), // captures window 'error' + 'unhandledrejection'
  ],
};
```

`provideBrowserGlobalErrorListeners()` — client side only. Angular SSR adds `unhandledRejection` and `uncaughtException` handlers automatically.

## Decision Guide

| Situation | Layer |
|---|---|
| Child component may crash independently | `@boundary` (Layer 1) |
| HTTP call, known failure modes | `catchError` in service/component (Layer 2) |
| Imperative async with recoverable errors | `try/catch` at call site (Layer 2) |
| Unexpected crash, need logging/analytics | `GlobalErrorHandler` (Layer 3) |
| `resource()` error state | Read `.error()` signal directly (Layer 2) |

## Testing

TestBed rethrows errors by default — prevents silent omissions in tests.

```ts
TestBed.configureTestingModule({
  rethrowApplicationErrors: false, // only when explicitly testing error paths
});
```
