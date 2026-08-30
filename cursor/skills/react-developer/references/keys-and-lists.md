# Keys & Lists

`key` is not a styling hook and not a generic prop — it's the identity React uses to match array items across renders. Getting it wrong doesn't crash anything; it silently corrupts state and produces subtle bugs, which is why it's easy to get away with the wrong choice until it isn't.

## How Keys Drive Reconciliation

When React re-renders a list, it diffs the new array of elements against the previous one. Without a stable identity per item, the only thing React has to go on is position — item 0 vs item 0, item 1 vs item 1. Keys give React an explicit identity independent of position:

- Same key, same position or not → React treats it as the *same* component instance and preserves its state (local `useState`, uncontrolled DOM state like scroll position or focus, refs).
- New key that wasn't there before → React mounts a brand-new component instance (state initializes fresh).
- A key that was there but is now gone → React unmounts that instance and discards its state.

```tsx
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoRow key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
```

Reorder `todos` in the array above (e.g. after a sort), and each `TodoRow` keeps its own state — an in-progress edit, an open menu — because `todo.id` didn't change, only its index did.

## Why Array Index as Key Is Usually Wrong

If you omit `key`, React defaults to the index — which is exactly why using the index explicitly buys you nothing over omitting it. The index is not a stable identity: it describes a slot in the array, not the item that currently occupies it.

```tsx
// Bad: index changes whenever the list is reordered, filtered, or spliced
{todos.map((todo, index) => (
  <TodoRow key={index} todo={todo} />
))}
```

Concretely, deleting the first item shifts every item below it up by one index. React sees "index 0's props changed" rather than "index 0 was removed" — so it reuses the DOM node and component state that belonged to the *old* item at that slot for the *new* item now sitting there. Symptoms:

- Text input values, checkbox states, or open/closed toggles appear to "stick" to the wrong row after a delete or reorder.
- Form fields inside a mapped list show stale values after sorting.
- Animations/transitions key off the wrong element.

Index keys are acceptable only when the list is truly static: never reordered, never filtered, never has items inserted/removed in the middle, for the lifetime of the component.

## Stable-ID Keys

The key should come from the data, not be invented at render time.

```tsx
// Good: a real, stable identifier from the data source
{users.map((user) => (
  <UserCard key={user.id} user={user} />
))}

// Acceptable for client-only, never-persisted items: generate the id once,
// when the item is created — not on every render.
function addItem(text: string) {
  setItems((prev) => [...prev, { id: crypto.randomUUID(), text }]);
}
```

- Never key with `Math.random()` or anything generated during render — a new value every render means React never matches old to new, so it destroys and recreates every item on every render.
- The key only needs to be unique among *siblings* in that array, not globally unique across the whole app.
- A composite string (`` `${a}-${b}` ``) is a fine key when there's no single-field ID, as long as the combination is stable and unique per item.

## Using `key` to Intentionally Reset State

Because a key change forces a remount, `key` doubles as an escape hatch for resetting a component's internal state when it conceptually represents a "different thing" — this is the recommended alternative to synchronizing state with an Effect.

```tsx
// Instead of resetting local state in a useEffect keyed on userId...
function ProfilePage({ userId }: { userId: string }) {
  return <ProfileForm userId={userId} key={userId} />;
}

function ProfileForm({ userId }: { userId: string }) {
  const [draft, setDraft] = useState('');
  // draft automatically resets to '' whenever userId changes,
  // because React mounts a fresh ProfileForm instance per key.
}
```

- Prefer extracting the child so the fresh-mount boundary is exactly the component that needs to reset, not the whole page.
- Don't reach for this pattern for lists (that's what per-item keys already do) — it's for single components that need a full state reset on prop identity change.
