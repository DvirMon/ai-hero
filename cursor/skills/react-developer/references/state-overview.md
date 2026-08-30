# State Overview

State is not one thing. Before reaching for a hook or a library, classify what you're holding:

- **Local state** — owned by one component (or a small subtree). Form input, toggle, hover. This file.
- **Server state** — a cached copy of data that lives on a server. See `server-state.md`.
- **URL state** — UI state that should survive a refresh or a shared link (filters, tabs, page). See `url-state.md`.
- **Global client state** — cross-tree UI state with no server or URL home (theme, modal stack, sidebar collapsed). See `global-state.md`.

Picking the wrong category is the most common React state mistake: fetched data stuffed into `useState` (should be server state), a filter kept in a store (should be URL state), or a single component's toggle lifted into global state "just in case." Classify first, then pick the tool.

## `useState`: local, independent values

Use `useState` when a piece of state changes on its own, independent of other state.

```tsx
function SearchBox() {
  const [query, setQuery] = useState('');

  return (
    <input value={query} onChange={(e) => setQuery(e.target.value)} />
  );
}
```

- Initialize lazily (`useState(() => expensiveInit())`) if the initial value is expensive to compute — the initializer only runs once.
- Multiple independent `useState` calls are fine. Don't merge them into one object just to have "one state" — that forces you to spread the rest of the object on every update.

## `useReducer`: state transitions, not state values

Reach for `useReducer` when updates are really **transitions** — several fields change together, or the next state depends on the action, not just the previous value.

```tsx
type State = { status: 'idle' | 'loading' | 'error'; error?: string };
type Action = { type: 'start' } | { type: 'success' } | { type: 'fail'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { status: 'loading' };
    case 'success':
      return { status: 'idle' };
    case 'fail':
      return { status: 'error', error: action.error };
  }
}

function Uploader() {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' });
  // dispatch({ type: 'start' }) instead of three separate setters
}
```

- Worth it when: 3+ related fields update together, the update logic branches on "what happened" rather than "what's the new value," or you want the transition logic testable in isolation (a reducer is a pure function — test it with no component at all).
- Not worth it for a single boolean or string — that's just `useState` with extra ceremony.
- A reducer does **not** replace `useContext` for prop drilling by itself; pairing `useReducer` + context is a pattern for sharing a transition-driven local state tree, not a substitute for the global-state tools in `global-state.md`.

## Derived state: compute, don't sync

If a value can be calculated from existing state or props, don't give it its own `useState` and an effect to keep it in sync. Compute it during render.

```tsx
// ❌ Redundant state + effect to keep it in sync
function Cart({ items }: { items: Item[] }) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    setTotal(items.reduce((sum, i) => sum + i.price, 0));
  }, [items]);
  return <span>{total}</span>;
}

// ✅ Derive it during render — no effect, no extra state, no lag
function Cart({ items }: { items: Item[] }) {
  const total = items.reduce((sum, i) => sum + i.price, 0);
  return <span>{total}</span>;
}
```

- If the derivation is expensive, wrap it in `useMemo` — that's a performance optimization, not a reason to promote it to state.
- The tell-tale smell is an effect whose only job is `setSomething(f(otherState))`. That's a same-render computation wearing an effect as a costume; it also causes an extra render.
- Exception: state that genuinely cannot be derived (e.g. it depends on history — "was this the third click" — or on an external, non-reactive source) legitimately needs its own slot.

## Colocation: keep state where it's used

Put state in the component that needs it, not in a parent "just in case a sibling needs it later." Lift state only when two components must actually share it.

```tsx
// ❌ Lifted for no reason — Parent re-renders on every keystroke,
// and every other child of Parent re-renders too
function Parent() {
  const [query, setQuery] = useState('');
  return (
    <>
      <SearchBox query={query} setQuery={setQuery} />
      <ExpensiveUnrelatedChart />
    </>
  );
}

// ✅ Colocated — only SearchBox re-renders when typing
function Parent() {
  return (
    <>
      <SearchBox />
      <ExpensiveUnrelatedChart />
    </>
  );
}
function SearchBox() {
  const [query, setQuery] = useState('');
  // ...
}
```

- Lift state to the nearest common ancestor only when a sibling actually needs to read or react to it — not preemptively.
- Colocation is also why "everything in one global store" is usually wrong: it turns local, independent state into cross-tree state, and every consumer of the store re-renders (or needs a selector) for changes it doesn't care about.
- When state does need to cross the tree, that's the signal to move to `global-state.md`, `url-state.md`, or `server-state.md` — depending on what kind of state it actually is.
