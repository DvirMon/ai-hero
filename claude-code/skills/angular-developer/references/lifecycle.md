# Component Lifecycle

Modern Angular lifecycle management is **reactive-first**. Avoid imperative lifecycle hooks — they are escape hatches, not the primary architecture.

## Core Principles

- Prefer **signals and computed values** for state instead of manual lifecycle updates
- Prefer **`effect()`** for reactive side effects
- Prefer **`afterNextRender`/`afterEveryRender`** instead of view lifecycle hooks
- Prefer **`DestroyRef`** instead of `ngOnDestroy`
- Use **`takeUntilDestroyed()`** for all Observable subscriptions

## Constructor Initialization

Use the constructor to initialize reactive state and register effects. Do not use `ngOnInit` for this.

```ts
@Component()
export class UserComponent {
  private readonly api = inject(UserApi);

  userId = input<string>();

  user = resource({
    request: () => this.userId(),
    loader: ({ request: id }) => this.api.getUser(id),
  });
}
```

## Input Reactivity — Avoid `ngOnChanges`

> **Avoid `ngOnChanges`.** Use signal inputs and `computed()` instead.

```ts
// ✅ Signals automatically recompute when inputs change
firstName = input('');
lastName = input('');
fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
```

## Side Effects — Prefer `effect()`

> **Avoid `ngOnInit` / `ngOnChanges` for side effects.** Use `effect()` instead.

```ts
constructor() {
  effect(() => {
    const user = this.user();
    this.logger.log(user);
  });
}
```

Use effects for: logging, analytics, derived async operations, synchronization.

> For full `effect()` rules, phases, SSR caveats, and cleanup patterns, see [effects.md](effects.md).

## DOM Access — Prefer Render Callbacks

> **Avoid `ngAfterViewInit`, `ngAfterViewChecked`, `ngAfterContentInit`, `ngAfterContentChecked`.** Use render callbacks instead.

```ts
constructor() {
  // Runs once after next DOM render
  afterNextRender(() => {
    this.chart.initialize();
  });

  // Runs after every DOM render
  afterEveryRender(() => {
    this.resizeObserver.observe(this.el.nativeElement);
  });
}
```

## Observable Cleanup — Use `takeUntilDestroyed`

> **FORBIDDEN.** Never use subscription arrays, `Subject destroy$`, or manual `unsubscribe()`. Always use `takeUntilDestroyed()` from `@angular/core/rxjs-interop`.

```ts
// ❌ NEVER write this
export class Legacy implements OnDestroy {
  private destroy$ = new Subject<void>();
  private sub = this.api.getUsers().pipe(takeUntil(this.destroy$)).subscribe();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// ✅ ALWAYS write this — called in injection context (constructor)
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class Modern {
  constructor() {
    this.api.getUsers()
      .pipe(takeUntilDestroyed())
      .subscribe(users => this.handleUsers(users));
  }
}
```

When calling **outside** an injection context (e.g. in `ngOnInit`), inject `DestroyRef` and pass it explicitly:

```ts
export class Component implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.api.getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
```

> For the full `toSignal()` / `toObservable()` / `takeUntilDestroyed` API reference, see [rxjs-interop.md](rxjs-interop.md).

## General Cleanup — Prefer `DestroyRef` over `ngOnDestroy`

> **Avoid `ngOnDestroy`** unless interoperating with legacy code that requires it. Use `DestroyRef` to colocate setup and cleanup logic in the constructor.

```ts
// ❌ AVOID: ngOnDestroy separates setup from cleanup
export class Legacy implements OnDestroy {
  private resizeObserver: ResizeObserver;

  constructor() {
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver.disconnect();
  }
}

// ✅ PREFER: DestroyRef keeps setup and cleanup together
export class Modern {
  constructor() {
    const observer = new ResizeObserver(() => this.onResize());
    observer.observe(this.el.nativeElement);

    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
```

## Lifecycle Hook Reference

| Hook | Status | Modern Replacement |
|---|---|---|
| `constructor` | **preferred** | initialize signals and effects |
| `ngOnInit` | avoid | constructor + signals |
| `ngOnChanges` | avoid | signal inputs + `computed()` |
| `ngAfterViewInit` | avoid | `afterNextRender` |
| `ngAfterViewChecked` | avoid | `afterEveryRender` |
| `ngAfterContentInit` | avoid | `afterNextRender` |
| `ngAfterContentChecked` | avoid | `afterEveryRender` |
| `ngDoCheck` | avoid | signals |
| `ngOnDestroy` | avoid | `DestroyRef` |

## Mental Model

```
constructor
   ↓
create signals / register effects
   ↓
Angular renders DOM
   ↓
afterNextRender
   ↓
reactive updates
   ↓
afterEveryRender
   ↓
DestroyRef cleanup
```

## Best Practices

- Initialize all state in the constructor.
- Use `computed()` for any state derived from signals or inputs.
- Use `effect()` only for side effects, never to update signal state.
- Use `afterNextRender` for one-time DOM setup.
- Use `takeUntilDestroyed()` for all subscriptions.
- Use `DestroyRef.onDestroy` for cleanup.
