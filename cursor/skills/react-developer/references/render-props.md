# Render Props

A render prop is a prop whose value is a function that returns JSX, letting the parent control what's rendered while the component that holds the render prop controls *when*/*with what data* it's called. Like HOCs, treat this as a **narrow exception, not a default** — a custom hook covers most logic-reuse needs without any JSX-shaped indirection. Reach for a render prop only when the reusable behavior is inherently tied to *where and how* something renders, not just to a piece of state or an effect.

## Anatomy (When You Do Need One)

The consuming component passes a function as a prop (often named `render`, or the `children` prop itself); the owning component calls that function with data during its own render.

```tsx
type MouseTrackerProps = {
  render: (position: { x: number; y: number }) => React.ReactNode;
};

function MouseTracker({ render }: MouseTrackerProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  return (
    <div
      style={{ height: "100vh" }}
      onMouseMove={(e) => setPosition({ x: e.clientX, y: e.clientY })}
    >
      {render(position)}
    </div>
  );
}

// Usage
<MouseTracker render={({ x, y }) => <p>Mouse at ({x}, {y})</p>} />;
```

- Using `children` as the function (`children: (data) => React.ReactNode`) is equivalent and reads slightly more naturally in JSX (`<MouseTracker>{(pos) => ...}</MouseTracker>`) — either form is fine.

## Why a Hook Usually Wins

The same tracking logic, extracted as a custom hook, needs no wrapper element and no render-function indirection — the consumer just calls the hook and renders however it wants.

```tsx
function useMousePosition() {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMove = (e: MouseEvent) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return position;
}

// Usage — no wrapper element, no function-as-child
function Cursor() {
  const { x, y } = useMousePosition();
  return <p>Mouse at ({x}, {y})</p>;
}
```

If the behavior is just "give me some state/derived value," always prefer this hook form.

## Valid Use Case: Behavior Coupled to *Where* JSX Renders

Render props still earn their place when the reusable logic must control the position, structure, or lifecycle of specific JSX nodes in a list — something a hook returning data can't do on its own, because the "which node renders how" decision has to happen inside the component that owns the layout.

```tsx
type VirtualizedListProps<T> = {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
};

function VirtualizedList<T>({ items, itemHeight, renderItem }: VirtualizedListProps<T>) {
  const { startIndex, endIndex, containerProps } = useVirtualization(items.length, itemHeight);

  return (
    <div {...containerProps}>
      {items.slice(startIndex, endIndex).map((item, i) => (
        <div key={startIndex + i} style={{ height: itemHeight }}>
          {renderItem(item, startIndex + i)}
        </div>
      ))}
    </div>
  );
}

// Usage
<VirtualizedList items={users} itemHeight={48} renderItem={(user) => <UserRow user={user} />} />;
```

Here the virtualization hook (`useVirtualization`) supplies the *data* (which slice to show), but the render prop is still needed because the list component — not the caller — decides how each visible slot is wrapped and positioned.

## When to Choose Render Prop vs. Hook

- Need to share plain state/derived values/side effects? → Custom hook, no render prop.
- Need the shared logic to dictate the structure or positioning of arbitrary caller-supplied JSX (virtualization, drag-and-drop item rendering)? → Render prop is acceptable.
- Building a UI primitive where children need access to *shared implicit state* (open/closed, active tab) rather than a callback? → Compound component (see `compound-components.md`), not a render prop.
