# Component Fundamentals

A React component is a JavaScript function that returns JSX — a description of what should appear on screen. Components are the unit of composition: you build UIs by nesting components inside other components.

## Anatomy of a Component

A component is a function whose name starts with a capital letter (so React/JSX can distinguish it from a plain HTML tag) and that returns renderable output.

```tsx
function Greeting() {
  return <h1>Hello, world</h1>;
}

// Used like an HTML tag, capitalized
export function App() {
  return (
    <main>
      <Greeting />
    </main>
  );
}
```

- Component names must be capitalized (`Greeting`, not `greeting`) — lowercase tags are treated as native DOM elements.
- A component can return JSX, a string, a number, `null`, `undefined`, or an array/Fragment of these. Returning `false`/`null`/`undefined` renders nothing.
- Never define a component inside another component's body — it gets recreated (and remounted) every render, losing state.

## JSX Basics

JSX is syntax sugar over `React.createElement`. It looks like HTML but is JavaScript, so it follows JS rules with a few adjustments.

```tsx
function UserCard({ name, isOnline }: { name: string; isOnline: boolean }) {
  return (
    <div className="card">
      <h2>{name}</h2>
      {isOnline && <span className="dot" />}
      <p>{isOnline ? "Online" : "Offline"}</p>
    </div>
  );
}
```

- Use `className`, not `class`; use `htmlFor`, not `for`.
- Curly braces `{}` embed any JavaScript expression (not statements — no `if`/`for` directly).
- A component must return a single root element, or use a Fragment (`<>...</>`) to group siblings without adding a DOM node.
- Every attribute is camelCase (`onClick`, `tabIndex`), matching the DOM property name rather than the HTML attribute name.

## Fragments

Use `<>...</>` (or the explicit `<Fragment key={...}>` form when a `key` is needed) to return multiple elements without an extra wrapper `<div>`.

```tsx
function Row() {
  return (
    <>
      <td>Name</td>
      <td>Email</td>
    </>
  );
}
```

## Minimal DOM Nesting

**Rule: Pass styling via `className` props directly to components instead of wrapping in extra `<div>`s.**

### Use `className` prop (preferred)

Spacing, theming, typography modifiers — pass directly to the component:

```tsx
// ✓ Good
<Eyebrow className={styles.marker}>{marker}</Eyebrow>
<Body className={styles.spacing}>{children}</Body>
<Heading level={3} className={styles.title}>{title}</Heading>
```

### Use wrapper `<div>` only for layout containers

Only when the `<div>` creates a structural layout that children depend on:

```tsx
// ✓ Good — div creates grid columns
<div className={styles.gridRow}>
  <div className={styles.leftColumn}>
    <Eyebrow>{marker}</Eyebrow>
  </div>
  <div className={styles.rightColumn}>
    <Heading>{title}</Heading>
  </div>
</div>

// ✓ Good — div is a flexbox container
<div className={styles.stack}>
  <Component1 />
  <Component2 />
</div>
```

### Anti-pattern: wrapper-only divs

```tsx
// ✗ Bad — div only applies margin, not layout
<div className={styles.spacing}>
  <Eyebrow>{marker}</Eyebrow>
</div>

// ✓ Fix — pass className to component
<Eyebrow className={styles.spacing}>{marker}</Eyebrow>
```

### Checklist before adding `<div>`

- Does this `<div>` create a grid/flex/layout container?
- Do child elements depend on this container's layout?
- Or is it just wrapping one component for styling?

If the last question is yes: use `className` prop instead.

## Composition Over Configuration

Prefer composing small components together over building one large component with many conditional branches and boolean props.

```tsx
// Prefer this
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

function Page() {
  return (
    <Card>
      <UserCard name="Ada" isOnline />
    </Card>
  );
}
```

- Passing components/JSX via `children` (or other named slots) scales better than adding a new boolean prop for every visual variant.
- A component should do one thing — rendering a chunk of UI for a given set of props. Data fetching, business logic, and cross-cutting concerns belong in hooks, not scattered through JSX.

## Core Rendering Model

- Components are pure functions of their props (and state/context): given the same inputs, they must return the same output, with no side effects during render (no mutating outside variables, no DOM writes).
- Side effects (subscriptions, fetches, DOM measurements) belong in `useEffect`/event handlers, not in the component body.
- React re-renders a component whenever its state or its parent's props change; the resulting JSX is diffed against the previous render to compute the minimal DOM update (reconciliation).
