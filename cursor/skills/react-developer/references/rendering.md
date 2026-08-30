# Rendering

React re-renders a component whenever its state, props, or context change. What that component *returns* — conditionals, lists, fragments, portals — determines what actually reaches the DOM. This file covers the mechanics of expressing "what to render," not when re-renders happen.

## Conditional Rendering

JSX has no `if` statement, so conditionals are expressed with JS operators inside the return value.

```tsx
function OrderStatus({ status }: { status: 'pending' | 'shipped' | 'error' }) {
  // Ternary: two mutually exclusive branches
  return status === 'error' ? (
    <ErrorBanner />
  ) : (
    <p>Order is {status}</p>
  );
}

function CartBadge({ count }: { count: number }) {
  // && for "render or render nothing"
  return <div>Cart{count > 0 && <span className="badge">{count}</span>}</div>;
}
```

- Never use `count && <Badge />` when `count` can be `0` — `0` is falsy but renders as the literal text "0". Use `count > 0 && ...` or a ternary with `null`.
- For 3+ branches, extract a small lookup object or a switch in a plain function above the component — nested ternaries in JSX are hard to read and review.

```tsx
const ICONS: Record<Status, React.ReactNode> = {
  pending: <ClockIcon />,
  shipped: <TruckIcon />,
  error: <AlertIcon />,
};

function StatusIcon({ status }: { status: Status }) {
  return ICONS[status];
}
```

## Rendering Lists

Use `Array.prototype.map` to turn data into elements. Every element in the resulting array needs a `key` (see [keys-and-lists.md](keys-and-lists.md) for why).

```tsx
function ProductList({ products }: { products: Product[] }) {
  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```

- Filter before you map (`items.filter(...).map(...)`) rather than returning `null` from inside the map callback — it keeps the render list clean and avoids stray `null` entries.
- Extract the row into its own component once the map callback needs more than one line of markup; put the `key` on the extracted component itself, not on an element inside it.

## Fragments

A component's return value must be a single element. `Fragment` (or the `<>...</>` shorthand) groups children without adding a wrapper DOM node — essential for markup where an extra `<div>` would break CSS grid/flex/table layout.

```tsx
function DescriptionRow() {
  return (
    <>
      <dt>Name</dt>
      <dd>Ada Lovelace</dd>
    </>
  );
}
```

Use the explicit `<Fragment key={...}>` form (imported from `react`) when a fragment is produced inside a `map` and needs a key — the `<>` shorthand cannot take props.

```tsx
import { Fragment } from 'react';

function Glossary({ terms }: { terms: Term[] }) {
  return (
    <dl>
      {terms.map((term) => (
        <Fragment key={term.id}>
          <dt>{term.name}</dt>
          <dd>{term.definition}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
```

## Portals

`createPortal` renders children into a DOM node outside the component's normal parent — the component still lives at its original spot in the *React tree* (context, event propagation), only its DOM output moves. Use it for modals, tooltips, and dropdowns that must escape an ancestor's `overflow: hidden` or a low `z-index` stacking context.

```tsx
import { createPortal } from 'react-dom';

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
```

- Events bubble through the **React tree**, not the DOM tree — a click inside a portal will still trigger an `onClick` on a React ancestor that wraps the portal call, even though the DOM node lives elsewhere. Call `e.stopPropagation()` on the portal's root if that's not wanted.
- Portals need a target node that exists when the component mounts. `document.body` is the common default; for a dedicated mount point, add a `<div id="portal-root">` in `index.html` and query it once, outside the component.
- Manage focus manually for modal portals (trap focus, restore it to the trigger element on close) — the portal alone doesn't give you WAI-ARIA dialog semantics for free.
