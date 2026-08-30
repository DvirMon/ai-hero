# `use()` API

`use()` reads the value of a resource — a Promise or a Context — during render. Unlike other Hooks, it can be called conditionally and inside loops, because it isn't a Hook itself: it's a special form the compiler and runtime understand.

```tsx
const value = use(resource); // resource: Promise<T> | Context<T>
```

## Reading Context

`use(SomeContext)` behaves like `useContext(SomeContext)`, but can live inside an `if` or a loop.

```tsx
import {use} from 'react';
import {ThemeContext} from './theme-context';

function HorizontalRule({show}: {show: boolean}) {
  if (show) {
    const theme = use(ThemeContext); // conditional — not allowed with useContext
    return <hr className={theme} />;
  }
  return null;
}
```

- Returns the value from the nearest provider above the call site, or the context's default value if there is none.
- Only looks *upward* from where it's called — a provider rendered later in the same component won't be seen.
- Not supported in Server Components.

## Unwrapping a Promise

`use(promise)` reads the resolved value of a Promise. If the Promise is still pending, the calling component **suspends**, showing the nearest `<Suspense>` fallback until it settles.

```tsx
import {use, Suspense} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {fetchAlbums} from './data';

function Albums({albumsPromise}: {albumsPromise: Promise<Album[]>}) {
  const albums = use(albumsPromise);
  return (
    <ul>
      {albums.map((album) => (
        <li key={album.id}>
          {album.title} ({album.year})
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallback={<p>Could not fetch albums.</p>}>
      <Suspense fallback={<p>Loading…</p>}>
        <Albums albumsPromise={fetchAlbums()} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

- If the Promise rejects, the error propagates to the nearest error boundary — always pair a `<Suspense>` boundary reading a Promise with an error boundary above it.
- **Never** wrap `use(promise)` in `try`/`catch` to handle rejection; it won't work. Use an error boundary instead.

### The Promise Must Be Cached, Not Created Fresh Every Render

`use()` needs the *same* Promise instance across re-renders, or the component re-suspends on every render.

```tsx
// Wrong: a brand-new Promise every render, re-suspends constantly
function Albums() {
  const albums = use(fetch('/albums').then((r) => r.json()));
}

// Right: cache Promises by key so use() sees a stable instance
const cache = new Map<string, Promise<unknown>>();

function fetchData<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    cache.set(url, getData(url));
  }
  return cache.get(url) as Promise<T>;
}
```

In practice, create the Promise once in a parent (or in a data-fetching layer / framework loader), and pass it down as a prop — as in the `Albums` example above — rather than creating it inside the component that calls `use`.

## Conditional Calling

```tsx
// Allowed: use() inside a condition or loop
if (show) {
  const value = use(resource);
}
for (const item of items) {
  const resolved = use(item.promise);
}
```

This is the key difference from `useState`/`useContext`/etc., which must run unconditionally on every render in the same order.

## Caveats

- `use()` must still be called inside a Component or Hook body — you can't call it from a plain utility function.
- Don't wrap it in `try`/`catch`; use an Error Boundary for Promise rejections.
- Cache/stabilize any Promise passed to `use()` — recreating it per render defeats Suspense and causes repeated fallback flashes.
- For values passed from a server to a client boundary, the resolved value must be serializable.
