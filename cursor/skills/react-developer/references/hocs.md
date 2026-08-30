# Higher-Order Components (HOCs)

A HOC is a function that takes a component and returns a new component wrapping it. Treat this as a **narrow exception, not a default pattern** — nearly everything HOCs historically did (injecting data, subscriptions, derived props) is better done with a custom hook (see `custom-hooks.md`). Reach for a HOC only when you need to wrap a component structurally or bridge to a third-party API that itself is HOC-shaped.

## Anatomy (When You Do Need One)

A HOC is just a function returning a component; it composes by wrapping, not by calling.

```tsx
function withErrorBoundary<P extends object>(
  Wrapped: React.ComponentType<P>,
  fallback: React.ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Wrapped {...props} />
      </ErrorBoundary>
    );
  };
}

const SafeDashboard = withErrorBoundary(Dashboard, <p>Something went wrong.</p>);
```

- Preserve the wrapped component's full prop type (`P`) and pass all props through — don't silently drop or rename props the caller expects.
- Give the returned component a `displayName` in real code (`WithErrorBoundary.displayName = ...`) so it's identifiable in React DevTools; omitted above for brevity.

## Valid Use Case: Structural Wrapping

Error boundaries are a legitimate HOC use case because the wrapping is structural (adding a component *around* the tree) — something a hook cannot do, since hooks don't render JSX around their caller.

```tsx
// A hook cannot inject a boundary around its own component's render output —
// this genuinely requires wrapping from the outside.
const SafePage = withErrorBoundary(UserProfilePage, <ErrorFallback />);
```

## Valid Use Case: Third-Party APIs

Some libraries (older Redux `connect`, some analytics/A-B testing SDKs) expose their integration points as HOCs. When adopting such a library, matching its own shape is reasonable rather than fighting it.

```tsx
// Example shape from a third-party library that only exposes a HOC API
const TrackedButton = withAnalytics(Button, { eventName: "cta_click" });
```

- Prefer the library's hook-based API if it offers one (most modern libraries do); only fall back to its HOC if that's the only integration surface available.

## Why to Avoid HOCs by Default

- **Wrapper hell**: stacking multiple HOCs (`withA(withB(withC(Component)))`) produces deep, hard-to-read component trees and makes debugging in React DevTools painful (many anonymous wrapper layers).
- **Prop collisions**: two HOCs that both inject a prop named `data` or `loading` silently clash, with no compile-time warning.
- **Static/ref handling**: a HOC must manually forward `ref` (via `useImperativeHandle`/prop typing) and hoist non-React statics off the wrapped component — easy to get wrong, and unnecessary with hooks.
- **Harder typing**: generic prop pass-through types (`P extends object`) are more awkward to get right in TypeScript than a hook's return type.

## Default Instead: A Custom Hook

Anything that only needs to *inject data or behavior* (not wrap JSX structurally) should be a hook, not a HOC.

```tsx
// Avoid: HOC injecting data as a prop
const withUser = (Wrapped) => (props) => {
  const user = useCurrentUser();
  return <Wrapped {...props} user={user} />;
};

// Prefer: plain hook, called where it's needed
function ProfileHeader() {
  const user = useCurrentUser();
  return <h1>{user.name}</h1>;
}
```

## When to Choose HOC vs. Hook

- Need to add a component *around* the wrapped tree (boundaries, providers, portals)? → HOC is acceptable.
- Need to inject data, derived values, or side-effect behavior into a component? → Custom hook.
- Integrating a third-party library whose only extension point is a HOC? → HOC, matching that library's shape.
- Everything else → default to a custom hook.
