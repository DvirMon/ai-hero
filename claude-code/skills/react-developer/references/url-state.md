# URL State: Search Params

Some UI state isn't local (`state-overview.md`) and isn't server data (`server-state.md`) — it's a description of *what the user is looking at*. Active tab, applied filters, current page, sort order. If a user should be able to refresh, hit back, or paste a link to a teammate and land in the same view, that state belongs in the URL, not in `useState` or a global store.

## Why the URL, not `useState`

```tsx
// ❌ Filter lives only in memory — refresh loses it, no shareable link,
// back button doesn't undo a filter change
function ProductList() {
  const [status, setStatus] = useState<'all' | 'active'>('all');
  // ...
}
```

A `useState` filter is invisible to the browser: it doesn't survive a refresh, isn't bookmarkable, and the back button won't step through it. Putting it in the URL fixes all three for free, and it's still just as easy to read and update.

## `useSearchParams`: read and write query params

```tsx
import { useSearchParams } from 'react-router';

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') ?? 'all';

  return (
    <select
      value={status}
      onChange={(e) => {
        setSearchParams((prev) => {
          prev.set('status', e.target.value);
          return prev;
        });
      }}
    >
      <option value="all">All</option>
      <option value="active">Active</option>
    </select>
  );
}
```

- `searchParams` is a standard `URLSearchParams` object — `.get(key)`, `.getAll(key)`, `.has(key)`.
- `searchParams.get('status')` returns `string | null` — always provide a fallback (`?? 'all'`) for the default case rather than writing the default into the URL on load.
- `setSearchParams` accepts a plain object, an array of tuples, a `URLSearchParams`, or (as above) a callback that receives the previous params — use the callback form when you're changing one param and want to preserve the others.

## Filters, tabs, and pagination

```tsx
function TabbedPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'overview';

  return (
    <>
      <nav>
        {(['overview', 'details', 'history'] as const).map((t) => (
          <button
            key={t}
            aria-current={tab === t}
            onClick={() => setSearchParams({ tab: t })}
          >
            {t}
          </button>
        ))}
      </nav>
      {tab === 'overview' && <Overview />}
      {tab === 'details' && <Details />}
      {tab === 'history' && <History />}
    </>
  );
}

function PaginatedTable() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');

  return (
    <button onClick={() => setSearchParams((prev) => {
      prev.set('page', String(page + 1));
      return prev;
    })}>
      Next page
    </button>
  );
}
```

- `setSearchParams({ tab: t })` replaces the *entire* query string with the object you pass — fine for a single independent param like a tab, wrong if you have other params (`page`, `status`) you need to keep. Use the callback form (mutate and return `prev`) whenever multiple params coexist.
- Numbers and booleans round-trip through the URL as strings — parse on read (`Number(...)`, `=== 'true'`), don't store typed values directly.
- Pair URL state with server state naturally: a page number or filter from `searchParams` typically feeds straight into a `useQuery` key (`queryKey: ['products', { status, page }]`) — see `server-state.md`. This is the standard shape for a filterable, paginated list.

## When not to use it

- Transient UI state that has no meaning to reload or share (an open dropdown, a hover state, in-progress form input before submit) stays local — don't pollute the URL with it.
- Sensitive or large values (tokens, full objects) don't belong in a query string — it's visible, logged, and length-limited. Keep the URL to small identifiers and let the component look up the rest.
