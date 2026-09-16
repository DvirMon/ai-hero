# Route Resources (Signals-based route data fetching)

Angular v21+ (`next`). Reactive alternative to `ResolveFn` — see [data-resolvers.md](data-resolvers.md).
Source: https://next.angular.dev/guide/routing/data-fetching-with-resources

## Why over resolvers

- **Parallel**: resources across matched parent/child routes run concurrently (300ms, not 200+300ms waterfall).
- **Non-blocking option**: activate the route immediately, render loading state.
- **Reload without navigation**: `.reload()` or signal-dependency change — no guard re-eval, no re-match.
- **Reactive**: exposes `isLoading()`, `error()`, `hasValue()`.

## Setup

```ts
import {provideRouter, withComponentInputBinding, withRouterResources} from '@angular/router';

bootstrapApplication(App, {
  providers: [provideRouter(routes, withComponentInputBinding(), withRouterResources())],
});
```

## Basic usage

`resources` runs in an injection context and receives a `ResourceContext` (`params()`, `queryParams()`, `data()`, plus static `snapshot`).

```ts
const routes: Routes = [
  {
    path: 'user/:id',
    component: UserProfile,
    resources: (ctx) => {
      const userService = inject(UserService);
      return {
        user: resource({
          params: () => ctx.params()['id'],
          loader: ({params: id, abortSignal}) => userService.getUser(id, {abortSignal}),
        }),
      };
    },
  },
];

@Component({template: `<p>User: {{ user().name }}</p>`})
export class UserProfile {
  user = input.required<User>(); // T, not Resource<T>
}
```

- Extract the **primitive** (`ctx.params()['id']`), not the whole params object — new object identity reloads needlessly.
- Forward `abortSignal` into fetch/HTTP so superseded or rolled-back navigations cancel cleanly.

## Resource kinds

Any `Resource` implementation works — `resource()`, `rxResource({stream})`, and an `async` factory for lazy imports:

```ts
resources: async (ctx) => {
  const {fetchUserData} = await import('./user-api');
  return {user: resource({params: () => ctx.params()['id'], loader: ({params: id}) => fetchUserData(id)})};
}
```

## Blocking (default) vs non-blocking

Blocking: navigation waits, input receives the resolved value `T`, component never sees loading/error; failures emit `NavigationError`.

Non-blocking: wrap in `nonBlocking()` — route activates immediately and the input receives the full `Resource<T>`.

```ts
resources: (ctx) => ({
  reportData: nonBlocking(resource({loader: () => fetchHeavyReportData()})),
})

@Component({
  template: `
    @if (reportData().isLoading()) { <p>Loading…</p> }
    @else if (reportData().error()) { <p>Error loading report.</p> }
    @else if (reportData().hasValue()) { <report-view [data]="reportData().value()" /> }
  `,
})
export class Reports {
  reportData = input.required<Resource<ReportData>>();
}
```

## Reload without renavigation

```ts
private userResource = inject(ActivatedRoute).resources?.['user'];
refreshUser() { this.userResource?.reload(); }
```

Or reactively — any signal read in `params` re-runs the loader:

```ts
resources: (ctx) => {
  const filter = inject(FilterService).filter;
  return {data: resource({
    params: () => ({id: ctx.params()['id'], filter: filter()}),
    loader: ({params}) => fetchData(params),
  })};
}
```

## Redirecting

Throw `RedirectCommand` from a **blocking** loader:

```ts
loader: async ({params: id}) => {
  const user = await fetchUser(id);
  if (!user) throw new RedirectCommand(router.parseUrl('/not-found'));
  return user;
}
```

## Transitional states

Router masks intermediate loading during pending navigation — `/user/1` → `/user/2` keeps old data visible until the new resource resolves. On guard-cancelled navigation, params revert and the previous resource snapshot is retained until the reverted state settles.

## Choosing

- New signal-based apps on v21+: prefer route resources.
- Need loading UI inside the route: `nonBlocking()`.
- Stuck on stable/older Angular, or trivial one-shot prefetch: `ResolveFn` still fine.
