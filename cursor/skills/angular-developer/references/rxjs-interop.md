# RxJS Interop

Angular provides first-class helpers in `@angular/core/rxjs-interop` for bridging signals and Observables. Prefer signal-based APIs where possible; use RxJS interop when you need RxJS operators or work with existing Observable APIs.

## `toSignal()` — Observable → Signal

Convert an Observable into a read-only signal. Must be called in an injection context (constructor or field initializer).

```ts
import { toSignal } from '@angular/core/rxjs-interop';

@Component()
export class UserListComponent {
  private readonly http = inject(HttpClient);

  // Async stream — provide initialValue to avoid undefined
  readonly $users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });

  // Synchronous source — use requireSync
  private readonly $userSubject = new BehaviorSubject<User | null>(null);
  readonly $currentUser = toSignal(this.$userSubject, { requireSync: true });
}
```

### Options

| Option | When to use |
|--------|-------------|
| `initialValue` | Async streams — avoids `undefined` until first emission |
| `requireSync` | Synchronous sources like `BehaviorSubject` — signal is never `undefined` |
| `injector` | When called outside injection context |

## `toObservable()` — Signal → Observable

Convert a signal into an Observable. Useful for applying RxJS operators that have no signal equivalent (e.g. `debounceTime`, `switchMap`).

```ts
import { toObservable } from '@angular/core/rxjs-interop';

@Component()
export class SearchComponent {
  readonly $query = signal('');

  // Apply debounce + switchMap, then bridge back to a signal
  readonly $results = toSignal(
    toObservable(this.$query).pipe(
      debounceTime(300),
      switchMap(query => this.http.get<Result[]>(`/api/search?q=${query}`)),
    ),
    { initialValue: [] },
  );
}
```

> Use `toObservable()` only when you need RxJS operators that cannot be expressed with `computed()` or `resource()`.

## `takeUntilDestroyed()` — Auto-Unsubscribe

> For the full cleanup pattern including `DestroyRef` and all `ngOnDestroy` replacements, see [lifecycle.md](lifecycle.md).

Automatically completes a subscription when the component is destroyed. **Always use this instead of manual subscription management.**

```ts
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Inside injection context (constructor / field initializer)
@Component()
export class MyComponent {
  constructor() {
    this.api.getUpdates()
      .pipe(takeUntilDestroyed())
      .subscribe(update => this.handleUpdate(update));
  }
}
```

When called **outside** an injection context (e.g. in `ngOnInit`), pass the `DestroyRef` explicitly:

```ts
@Component()
export class MyComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.api.getUpdates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
```

> **FORBIDDEN.** Never use subscription arrays, `Subject destroy$`, or manual `unsubscribe()`. Always use `takeUntilDestroyed()`.

```ts
// ❌ NEVER write this
private destroy$ = new Subject<void>();

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

someObs$.pipe(takeUntil(this.destroy$)).subscribe();

// ✅ ALWAYS write this
constructor() {
  someObs$.pipe(takeUntilDestroyed()).subscribe();
}
```

## `outputFromObservable()` — Observable → Output

Bridge an Observable into a component output:

```ts
import { outputFromObservable } from '@angular/core/rxjs-interop';

@Component()
export class TypeaheadComponent {
  private readonly input$ = new Subject<string>();

  // Debounce internally, expose as a standard Angular output
  readonly valueChange = outputFromObservable(
    this.input$.pipe(debounceTime(300), distinctUntilChanged()),
  );
}
```

## `outputToObservable()` — Output → Observable

Convert an `OutputRef` into an Observable for use in RxJS pipelines:

```ts
import { outputToObservable } from '@angular/core/rxjs-interop';

const obs$ = outputToObservable(this.myComponent.valueChange);
```

## `rxResource()` — Observable Loader

Use when your data source is already Observable-based:

```ts
import { rxResource } from '@angular/core/rxjs-interop';

@Component()
export class PhotoComponent {
  readonly $photoId = input.required<string>();

  photo = rxResource({
    params: this.$photoId,
    stream: (id) => this.photoService.getPhoto$(id).pipe(
      catchError(err => { console.error(err); return of(undefined); }),
    ),
  });
}
```

## Decision Guide

| Goal | Recommended API |
|------|----------------|
| Observable stream → signal | `toSignal()` |
| Signal → Observable (for operators) | `toObservable()` |
| Auto-cleanup subscription | `takeUntilDestroyed()` |
| Observable output from component | `outputFromObservable()` |
| Observable-based resource | `rxResource()` |
| HTTP GET → signal | `httpResource()` (see `http.md`) |
| Generic async → signal | `resource()` (see `http.md`) |

## Best Practices

- Prefer `toSignal()` over manually subscribing and setting signal values.
- Always provide `initialValue` or `requireSync` to avoid `undefined` in templates.
- Always use `takeUntilDestroyed()` for subscriptions — never manage them manually.
- Use `toObservable()` only when you need operators unavailable in the signal API.
- Bridge back to signals with `toSignal()` after applying RxJS operators.
