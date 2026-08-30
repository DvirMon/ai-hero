# Code Splitting

Code splitting breaks the JS bundle into chunks that load on demand instead of all at once. In a Vite SPA this happens at two levels: **component-level** (`React.lazy`) and **route-level** (React Router's lazy route modules). Both rely on dynamic `import()`, which Vite automatically turns into a separate chunk.

## Component-Level Splitting (`React.lazy`)

Use `React.lazy` to defer loading a component until it's actually rendered — heavy widgets, modals, charts, or anything below the fold.

```tsx
import { lazy, Suspense } from 'react';

// The import() call is the split point — Vite emits a separate chunk for it.
const AnalyticsChart = lazy(() => import('./AnalyticsChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <AnalyticsChart />
    </Suspense>
  );
}
```

- `lazy()` expects the imported module's **default export** to be the component. For a named export, re-export it as default in a small wrapper or map it inline:
  ```tsx
  const AnalyticsChart = lazy(() =>
    import('./AnalyticsChart').then((m) => ({ default: m.AnalyticsChart })),
  );
  ```
- Every `lazy` component needs a `<Suspense>` ancestor — there's no default fallback, so a missing boundary throws at runtime the first time the chunk is still loading.
- Pair `Suspense` with an error boundary. A failed dynamic import (offline user, deploy mid-session) rejects the promise, and only an error boundary catches that — `Suspense` does not.
- Don't wrap each lazy component in its own tiny `Suspense`. Group related lazy siblings under one boundary so they load in parallel and show one coherent fallback instead of a cascade of spinners.

## Route-Level Splitting (React Router)

Route-level splitting is the highest-leverage split in an SPA: each route's code, and only that route's code, loads when the user navigates there. React Router's data routers support this natively via the `lazy` route property — no manual `React.lazy` + `Suspense` wiring needed, the router handles the pending state.

```tsx
import { createBrowserRouter } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { Layout } = await import('./routes/layout');
      return { Component: Layout };
    },
  },
  {
    path: '/orders/:orderId',
    lazy: {
      // Each property loads independently and in parallel.
      loader: async () => (await import('./routes/order.loader')).loader,
      Component: async () => (await import('./routes/order.page')).Component,
    },
  },
]);
```

- Prefer the **granular object form** (`lazy: { Component, loader, action }`) over a single `lazy: async () => {...}` function — the router fetches each piece in parallel instead of waiting for one module that bundles all of them.
- Export a named `Component` (not `element`) from the lazy module — the router calls it as a component, so it can itself use hooks.
- `loader`/`action` split independently of `Component`, so route data can start fetching before the route's UI code finishes downloading.
- Route-level splitting composes with component-level splitting: a route chunk can itself contain `React.lazy()` calls for below-the-fold pieces of that page.

## Preloading

Splitting trades a smaller initial bundle for a network round-trip on navigation. Offset that latency by prefetching the next likely chunk:

```tsx
<Link
  to="/orders/123"
  onMouseEnter={() => import('./routes/order.page')}
>
  View order
</Link>
```

- React Router's `<Link>` already does this automatically when using the framework's built-in prefetch behavior (`prefetch="intent"` in framework mode); for library mode, hover/focus-triggered `import()` gets the same effect.
- Only prefetch on real intent signals (hover, focus, viewport visibility) — prefetching everything defeats the purpose of splitting.

## Error Boundaries Around Lazy Content

A chunk load can fail — a stale deploy, an offline user mid-navigation. Wrap lazy content in an error boundary so that failure renders a retry UI instead of crashing the tree:

```tsx
<RouteErrorBoundary fallback={<ChunkLoadError onRetry={() => window.location.reload()} />}>
  <Suspense fallback={<PageSkeleton />}>
    <AnalyticsChart />
  </Suspense>
</RouteErrorBoundary>
```

- React Router's data routers already pair this for you: a route's `ErrorBoundary` (or `errorElement`) catches a failed `lazy` module load the same way it catches a loader/action error.
- For plain `React.lazy`, the error boundary is your own responsibility — there's no automatic one.

## When Not to Split

- Don't lazy-load components needed for the initial paint (above-the-fold layout, nav) — that just adds a network waterfall for zero benefit.
- Splitting has overhead: every chunk boundary is a new request and a new `<script>` parse. Splitting a 2 KB component isn't worth it; splitting a 200 KB chart library is.
- Check the actual payoff with the bundle visualizer (see [bundle-size.md](bundle-size.md)) before adding a split — measure, don't guess.
- Vite's dependency pre-bundling (esbuild, dev-only) is unrelated to this — code splitting is a production-build concern about chunk boundaries, not about how deps are pre-optimized in dev.
