# Server State: TanStack Query

Server state is data your app doesn't own — it lives on a server, can go stale the moment you fetch it, and is fetched asynchronously. It behaves nothing like local state (`state-overview.md`): it needs caching, deduplication, background refresh, and retry logic. TanStack Query (`@tanstack/react-query`) handles all of that so you don't hand-roll it with `useEffect` + `useState`.

## Why not `useEffect` + `useState`

```tsx
// ❌ Manual fetching: no caching, no dedup, no retry, race conditions on fast refetch
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTodos().then((data) => {
      if (!cancelled) {
        setTodos(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);
  // ...
}
```

Every one of those lines — the cancellation flag, the loading flag, the missing error handling, the fact that two components fetching the same data both hit the network — is a problem TanStack Query already solved. It caches by key, dedupes in-flight requests, refetches on window focus/reconnect, and gives you `isPending`/`isError` for free.

## `useQuery`: fetching and caching

```tsx
import { useQuery } from '@tanstack/react-query';

function TodoList() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos, // must return a Promise
  });

  if (isPending) return <span>Loading...</span>;
  if (isError) return <span>Error: {error.message}</span>;

  return (
    <ul>
      {data.map((todo) => <li key={todo.id}>{todo.title}</li>)}
    </ul>
  );
}
```

- `queryKey` and `queryFn` are both required — the object-based signature is the current (v5) API; there's no positional-args form anymore.
- `data` is `undefined` until the first successful fetch — check `isPending`, don't just check `data`.
- Calling `useQuery` with the same `queryKey` from multiple components shares one cached result and one in-flight request — no extra network calls, no coordination code needed.

## Query keys: the cache's address

The `queryKey` is how the cache is indexed, invalidated, and refetched. Include every variable the query depends on.

```tsx
function TodoDetail({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ['todos', id],       // parameterized — one cache entry per id
    queryFn: () => fetchTodo(id),
  });
}
```

- Treat the key like a dependency array: if the query function reads a variable (`id`, a filter, a page number), that variable belongs in the key. Otherwise stale data from a different `id` can be served.
- Structure keys hierarchically (`['todos']`, `['todos', id]`, `['todos', { status: 'done' }]`) so you can invalidate broadly (`['todos']` — everything todo-related) or narrowly (`['todos', id]` — just this one).

## `useMutation`: writes, with cache invalidation on success

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddTodoForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newTodo: { title: string }) => createTodo(newTodo),
    onSuccess: () => {
      // Tell the cache the todos list is stale — triggers a refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <button
      disabled={mutation.isPending}
      onClick={() => mutation.mutate({ title: 'Write docs' })}
    >
      {mutation.isPending ? 'Saving...' : 'Add Todo'}
    </button>
  );
}
```

- `mutate()` fires and forgets (handle results via `onSuccess`/`onError`); `mutateAsync()` returns a Promise if you need to `await` it (e.g. before navigating away).
- `invalidateQueries({ queryKey: ['todos'] })` matches by prefix — it marks every query starting with `['todos']` (the list, and any `['todos', id]` detail views) as stale and triggers a refetch for currently-mounted observers. This is the standard way to keep the UI in sync after a write — no manual `setTodos([...todos, newTodo])` bookkeeping.
- For instant feedback before the server responds, use optimistic updates (`onMutate` + rollback in `onError`) — but invalidation-on-success is the right default and should be reached for first.

## Rule of thumb

If the data came from `fetch`/an API client and represents something the server owns, it's server state — it belongs in `useQuery`/`useMutation`, never in a `useState` you manually populate in an effect.
