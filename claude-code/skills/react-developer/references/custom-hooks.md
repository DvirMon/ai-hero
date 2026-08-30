# Custom Hooks

A custom hook is a JavaScript function whose name starts with `use` and that calls other hooks. It's the default way to extract and reuse stateful logic between components — reach for it before HOCs or render props.

## Anatomy

A custom hook is just a function that composes built-in hooks (`useState`, `useEffect`, etc.) into a reusable unit, and returns whatever the consuming component needs.

```tsx
function useToggle(initialValue = false) {
  const [value, setValue] = React.useState(initialValue);

  const toggle = React.useCallback(() => setValue((v) => !v), []);

  return [value, toggle] as const;
}

// Usage
function Accordion() {
  const [isOpen, toggleOpen] = useToggle();

  return (
    <div>
      <button onClick={toggleOpen}>{isOpen ? "Collapse" : "Expand"}</button>
      {isOpen && <p>Details…</p>}
    </div>
  );
}
```

- Naming with a `use` prefix is not just convention — it's how React's linter and runtime know a function follows the Rules of Hooks (can call other hooks, participates in Fast Refresh correctly).
- Each component that calls a custom hook gets its own independent state — calling `useToggle()` in two components does not share the toggle between them.

## Why Custom Hooks Over HOCs/Render Props

Custom hooks replace nearly every classic "logic reuse" pattern from older React because they don't add wrapper components, don't create prop-name collisions, and compose by ordinary function calls.

```tsx
// One hook, freely combined with others, no wrapper nesting
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);
  const isOnline = usePresence(userId);
  const windowWidth = useWindowWidth();

  if (isLoading) return <Spinner />;
  return <ProfileCard user={user} isOnline={isOnline} compact={windowWidth < 480} />;
}
```

- No "wrapper hell" in the component tree (unlike nested HOCs), and no "wrapper hell" in JSX (unlike nested render props) — hooks just stack as function calls at the top of the component.
- Naming stays clean: `const { data, isLoading } = useUser(id)` never collides with another hook's return value, unlike HOC-injected props that can clash.

## Encapsulating an Effect + Cleanup

A common use is wrapping a subscription or external API with its setup/teardown, so components don't repeat `useEffect` boilerplate.

```tsx
function useWindowWidth() {
  const [width, setWidth] = React.useState(() => window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}
```

- Return only what consumers need (a value, or a small object/tuple) — don't leak internal implementation details like raw event objects.
- Put cleanup logic in the effect's return function; every subscription needs a matching teardown to avoid leaks across remounts.

## Sharing Async/Data Logic

Custom hooks are the natural home for request state (loading/error/data) so components stay declarative.

```tsx
function useUser(userId: string) {
  const [state, setState] = React.useState<{
    data: User | null;
    isLoading: boolean;
    error: Error | null;
  }>({ data: null, isLoading: true, error: null });

  React.useEffect(() => {
    let cancelled = false;
    setState({ data: null, isLoading: true, error: null });

    fetchUser(userId)
      .then((data) => !cancelled && setState({ data, isLoading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, isLoading: false, error }));

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return state;
}
```

- For real apps, prefer a library like TanStack Query over hand-rolled fetch hooks (see `server-state.md`) — this pattern is shown for illustration of the extraction technique, not as production guidance.
- Guard against race conditions (a `cancelled` flag or `AbortController`) whenever the effect's dependency can change before the previous async call resolves.

## Composing Hooks Together

Custom hooks can call other custom hooks, letting you build higher-level behavior from smaller reusable pieces.

```tsx
function useDebouncedSearch(query: string, delayMs = 300) {
  const debouncedQuery = useDebouncedValue(query, delayMs);
  return useSearchResults(debouncedQuery);
}
```

## Rules & Nuances

- Only call hooks (custom or built-in) at the top level of a function component or another custom hook — never inside loops, conditions, or nested functions.
- A custom hook must call at least one built-in hook (directly or transitively); a function that doesn't touch hooks is just a regular helper function — don't prefix it with `use`.
- Return a stable shape: prefer a tuple (`[value, setValue]`) for two tightly-coupled values (mirrors `useState`), or a small object for three or more named values.
- Custom hooks don't render anything and don't wrap the component tree — if you find yourself needing to inject JSX or wrap children, that's a sign you actually need composition (children/slots), not a hook.
- Extract a custom hook when logic is reused across two or more components, or when a single component's logic is complex enough to benefit from isolated naming and testing — don't extract prematurely for one-off logic.
