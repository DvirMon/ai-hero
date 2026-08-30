# Transitions

Transitions let you mark a state update as **non-urgent**. React keeps the current UI interactive while it renders the update in the background, instead of blocking on it like a normal (urgent) update.

## Marking an Update as a Transition (`useTransition`)

Use `useTransition()` when you have access to the `set` function for the state you're updating and want a pending flag alongside it.

```tsx
import {useState, useTransition} from 'react';

function TabContainer() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState('about');

  function selectTab(nextTab: string) {
    startTransition(() => {
      setTab(nextTab);
    });
  }

  return (
    <>
      <TabButton isActive={tab === 'about'} onClick={() => selectTab('about')}>
        About
      </TabButton>
      {isPending && <Spinner />}
      <TabPanel tab={tab} />
    </>
  );
}
```

- `startTransition(action)` calls `action` immediately and marks every synchronous `set` call inside it as low-priority.
- `isPending` flips to `true` while the background render is in flight — use it to show a spinner or dim stale content.
- `startTransition` has stable identity; it's safe to omit from effect dependency arrays.

### Async Actions Inside a Transition

State updates **after an `await`** are not automatically part of the Transition — wrap them in a nested `startTransition`:

```tsx
function onSubmit(newQuantity: number) {
  startTransition(async () => {
    const saved = await updateQuantity(newQuantity); // not yet a Transition
    startTransition(() => {
      setQuantity(saved); // re-wrapped, so this one is
    });
  });
}
```

### Caveats

- `useTransition` is a Hook, so it only works inside components/custom Hooks. Outside of components, use the standalone `startTransition` import instead.
- You need the `set` function itself to use `useTransition`. If you only have a *value* (e.g. a prop passed down, not the setter), reach for `useDeferredValue` instead.
- Transition updates cannot control a text input's value directly — keep the input backed by a plain, urgent `useState`.
- Transitions are interruptible: a newer update can abandon in-progress background rendering.

## Deferring a Value (`useDeferredValue`)

Use `useDeferredValue(value, initialValue?)` when you have a *value* — often one you don't own the setter for — and want a "lagging" copy that updates without blocking urgent input like typing.

```tsx
import {Suspense, useState, useDeferredValue} from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Suspense fallback={<h2>Loading...</h2>}>
        <div style={{opacity: isStale ? 0.5 : 1}}>
          <SearchResults query={deferredQuery} />
        </div>
      </Suspense>
    </>
  );
}
```

- The input's own `value={query}` stays instantly responsive on every keystroke.
- `deferredQuery` re-renders `SearchResults` in the background, "lagging behind" the real value while typing is fast.
- Compare `query !== deferredQuery` to know a background render is stale/pending, e.g. to dim old results.
- Pass an `initialValue` as the second argument to control what's rendered on mount; without it, the first render just uses `value` directly (no deferral).

### `useTransition` vs. `useDeferredValue`

- Own the setter and want a pending flag around a batch of updates → `useTransition`.
- Only have the value (e.g. it's a prop) and want it to lag rather than block → `useDeferredValue`.
- Both integrate with `<Suspense>`: a deferred/transitioned render that suspends shows old content instead of the fallback, rather than yanking the UI back to a loading state.

### Caveats

- `useDeferredValue` doesn't skip network requests by itself — pair it with request deduplication/caching if that matters.
- Pass primitives or stable references. Creating a brand-new object/array as `value` on every render defeats the "lag" and re-triggers background renders constantly.
- Inside a Transition, `useDeferredValue` always returns the new value immediately — it only defers for updates that aren't already wrapped in a Transition.
