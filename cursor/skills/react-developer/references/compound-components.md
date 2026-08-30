# Compound Components

Compound components are a set of components that work together to form one cohesive UI primitive, sharing implicit state without the caller having to manage or pass that state manually. The classic shape is `<Tabs><Tabs.List>...</Tabs.List><Tabs.Panel>...</Tabs.Panel></Tabs>` — the parent (`Tabs`) owns the state, and children read/update it via Context.

## When to Reach for This Pattern

Use compound components when building a reusable UI primitive (tabs, accordion, menu, disclosure, select) where multiple sibling parts must stay in sync with shared state, and you want the calling code to compose the pieces freely rather than configuring one monolithic component via props.

```tsx
// The API this pattern enables:
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Tab value="profile">Profile</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="profile">Profile content</Tabs.Panel>
  <Tabs.Panel value="settings">Settings content</Tabs.Panel>
</Tabs>
```

- Compare to a single component with a `tabs={[...]}` config prop: that forces all tab content through one data shape and makes custom per-tab JSX awkward. Compound components let each child be arbitrary JSX.

## Building It: Context + Parent Component

The parent component creates the shared state and exposes it through a Context; child components consume that Context instead of receiving props directly from the caller.

```tsx
type TabsContextValue = {
  activeValue: string;
  setActiveValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs.* components must be rendered inside <Tabs>");
  }
  return context;
}

type TabsProps = {
  defaultValue: string;
  children: React.ReactNode;
};

function Tabs({ defaultValue, children }: TabsProps) {
  const [activeValue, setActiveValue] = React.useState(defaultValue);

  return (
    <TabsContext value={{ activeValue, setActiveValue }}>
      <div className="tabs">{children}</div>
    </TabsContext>
  );
}
```

- React 19 allows rendering the Context itself as the provider (`<TabsContext value={...}>`) instead of `<TabsContext.Provider value={...}>`. The `.Provider` form still works and is fine in a codebase that already uses it consistently, but prefer the shorter form for new code.
- Throwing from `useTabsContext()` when the context is `null` turns "used `Tabs.Tab` outside `<Tabs>`" from a silent bug into an immediate, clear error.

## Building It: The Child Components

Each child reads the shared context to render correctly and to update shared state on interaction.

```tsx
function TabsList({ children }: { children: React.ReactNode }) {
  return <div role="tablist">{children}</div>;
}

function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeValue, setActiveValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={isActive ? "tab tab-active" : "tab"}
      onClick={() => setActiveValue(value)}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeValue } = useTabsContext();
  if (activeValue !== value) return null;
  return <div role="tabpanel">{children}</div>;
}
```

## Attaching Children as Static Properties

Attach the child components to the parent as static properties so the caller can use the `<Tabs.Tab>` dotted syntax.

```tsx
Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export { Tabs };
```

- The dotted syntax (`Tabs.Tab`) is purely organizational — it signals "this only makes sense inside `Tabs`" and keeps the import list short. Named exports (`TabsTab`) work identically at runtime; use whichever convention the codebase already favors, but be consistent.

## Nuances & Gotchas

- Each child must actually be rendered as a descendant of the parent provider — compound components rely on the React tree, not on direct parent-child JSX adjacency, so children can be nested inside other wrapper elements/components as long as they stay under the provider.
- Don't over-share: put in context only what genuinely needs to be implicit and shared (active tab id, setter). Anything a single child needs privately stays as that child's own local state or plain props.
- Guard against misuse with a context-null check (as shown) rather than letting children silently read `undefined` and produce confusing runtime errors deeper in the render.
- This pattern is for *sibling coordination* (shared state across a fixed family of parts). If you only need to let a caller inject arbitrary content at one slot, plain `children`/named-slot props are simpler and don't need Context at all.
- Compound components compose well with controlled/uncontrolled duality: accept both `defaultValue` (uncontrolled) and `value`/`onValueChange` (controlled) on the parent if callers need to own the active tab externally.
