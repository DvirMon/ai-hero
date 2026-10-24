# Component API Design — React Examples

> Guideline, principle, and pattern-selection decision tree live in `component-api.md` (agnostic). This file is React syntax only, mapped to that file's pattern numbers.

> `{prefix}` · `{Prefix}` resolve from the design-system config. Components PascalCase
> (`{Prefix}Card`), hooks camelCase (`use{Prefix}Autosize`) unless `{conventions}` § API
> conventions says otherwise.

## Pattern 1 — Hook-as-feature

Behavior lives in a hook, not a component. Hook returns ref + handlers/props to spread onto host element. No own JSX output.

```typescript
function use{Prefix}Autosize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
  }, [value]);
  return ref;
}
```

```tsx
const ref = use{Prefix}Autosize(value);
<textarea ref={ref} value={value} onChange={e => setValue(e.target.value)} />
```

**Examples:** `use{Prefix}Autosize` on `<textarea>`, `use{Prefix}Autocomplete` on `<input>`, `use{Prefix}Editable` on any heading.

---

## Pattern 2 — Portal-based content

Check codebase for internal overlay/portal wrapper first — use it before reaching for raw `createPortal` from `react-dom`.

```tsx
import { createPortal } from 'react-dom';

function {Prefix}Dialog({ open, onClose, children }: {Prefix}DialogProps) {
  if (!open) return null;
  return createPortal(
    <div className="{prefix}-dialog-overlay" onClick={onClose}>{children}</div>,
    document.body
  );
}
```

---

## Pattern 3 — Trigger + panel

```tsx
const [panelRef, triggerProps] = use{Prefix}Autocomplete();

<input {...triggerProps} />
<{Prefix}AutocompletePanel ref={panelRef}>...</{Prefix}AutocompletePanel>
```

---

## Pattern 4 — Composable sub-components

Parent creates context; children read it via hook. No direct import coupling to parent internals.

```tsx
// Parent
const {Prefix}CardContext = createContext<{Prefix}CardContextValue | null>(null);

function {Prefix}Card({ children }: {Prefix}CardProps) {
  const [items, setItems] = useState<string[]>([]);
  const register = useCallback((id: string) => setItems(prev => [...prev, id]), []);
  return (
    <{Prefix}CardContext.Provider value={{ items, register }}>
      <div className="{prefix}-card">{children}</div>
    </{Prefix}CardContext.Provider>
  );
}

// Child reads context — optional, must work standalone if parent absent
function {Prefix}CardTitle({ children }: {Prefix}CardTitleProps) {
  const card = useContext({Prefix}CardContext);
  useEffect(() => { card?.register('title'); }, [card]);
  return <div className="{prefix}-card-title">{children}</div>;
}
```

```tsx
<{Prefix}Card>
  <{Prefix}CardTitle>Budget Overview</{Prefix}CardTitle>
  <{Prefix}CardLabel color="success">+12%</{Prefix}CardLabel>
</{Prefix}Card>
```

Export all sub-components from the package entry point (`index.ts`) — they are independently usable.

---

## Pattern 5a — Simple children projection

```tsx
function {Prefix}Container({ children }: { children: ReactNode }) {
  return <div className="container">{children}</div>;
}
```

---

## Pattern 5b — Named slots

Use typed props for named regions, not a magic child-type scan. Prefer explicit slot props over `children` inspection/cloning.

```tsx
interface {Prefix}CardProps {
  title?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode; // body — default slot
}

function {Prefix}Card({ title, actions, children }: {Prefix}CardProps) {
  return (
    <div className="{prefix}-card">
      {title && <div className="header">{title}</div>}
      <div className="body">{children}</div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}
```

```tsx
<{Prefix}Card
  title="My Title"
  actions={<button>Save</button>}
>
  <p>Rich content including <{Prefix}Icon name="info" /></p>
</{Prefix}Card>
```

---

## Figma Variant → React Prop Mapping

| Figma variant | React pattern |
|---|---|
| Enum (`Type=Primary,Secondary`) | `appearance?: 'primary' \| 'secondary'` (default `'primary'`) |
| Boolean toggle (`Show icon=True/False`) | `showIcon?: boolean` (default `false`) |
| Static label / title | `title?: ReactNode` slot prop |
| Variable body content | `children: ReactNode` |
| Action buttons / links | `actions?: ReactNode` slot prop |
| Color/intent (`Color=Danger,Success`) | `color?: 'neutral' \| 'danger' \| 'success'` |
| Hover/focus state | CSS pseudo-class — not a prop |
| Disabled state | `disabled?: boolean` (default `false`) |

---

## Public API Exports

### Simple component

```typescript
export { {Prefix}Badge } from './{prefix}-badge';
export type { {Prefix}BadgeProps, BadgeVariant, BadgeSize } from './{prefix}-badge';
```

### Multi-atomic family (Pattern 4)

```typescript
export { {Prefix}Stepper }      from './{prefix}-stepper';
export { {Prefix}Step }         from './{prefix}-step';
export { {Prefix}StepperLabel } from './{prefix}-stepper-label';
export type { StepperOrientation } from './{prefix}-stepper';
```

No convenience array export needed (unlike Angular NgModule-style groupings) — consumers import each piece directly; a barrel `index.ts` already covers grouping.
