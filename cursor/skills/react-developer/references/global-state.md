# Global UI State: Zustand & Jotai

Global client state is for state that (a) isn't server data (`server-state.md`), (b) isn't worth putting in the URL (`url-state.md`), and (c) is genuinely needed across parts of the tree that don't share a convenient common ancestor. Theme, a modal/toast stack, sidebar collapsed state, a multi-step wizard's in-progress data spanning routes.

## When global state is *not* warranted

- Fetched data — that's server state, cached and invalidated by TanStack Query, not stored a second time in a global store.
- Filters, tabs, pagination — that's URL state; putting it in a store instead loses shareable links and back-button support.
- Anything only one subtree touches — colocate it (`state-overview.md`) instead of promoting it "just in case."

The tell that you actually need this file: you've traced the data flow and the state really is read/written from unrelated branches of the component tree, with no server or URL home.

## Zustand: a store with actions

Zustand models global state as one (or a few) stores: a single hook that returns state and the functions that update it, selected from a plain object.

```tsx
// store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
```

```tsx
// Sidebar.tsx — subscribes only to what it reads
function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <button onClick={toggleSidebar}>{sidebarOpen ? 'Close' : 'Open'}</button>
  );
}
```

- **Selector pattern**: always call the hook with a selector (`useUIStore((s) => s.sidebarOpen)`), never destructure the whole store (`useUIStore()`) — a full-store subscription re-renders on *any* field change, defeating the point.
- Selecting multiple fields at once creates a new object each render; wrap that selector in `useShallow` (from `zustand/shallow`) to avoid re-rendering when the individual values haven't changed.
- Actions live in the store next to the state they mutate (`toggleSidebar` beside `sidebarOpen`) — components call actions, they don't reach in and call `set` directly.
- One store is usually enough for a whole app's global UI state; split into multiple stores only along clear domain boundaries (e.g. `useUIStore` vs `useAuthStore`), not per-feature by default.

## Jotai: atoms, not a store

Jotai models the same kind of state as small, independent, composable units ("atoms") instead of one big object. Components subscribe to individual atoms directly — there's no selector step because each atom already is the granular unit.

```tsx
// atoms.ts
import { atom } from 'jotai';

export const sidebarOpenAtom = atom(true);

// Derived atom — recomputes when sidebarOpenAtom changes
export const sidebarLabelAtom = atom((get) =>
  get(sidebarOpenAtom) ? 'Close' : 'Open'
);
```

```tsx
// Sidebar.tsx
import { useAtom, useAtomValue } from 'jotai';
import { sidebarOpenAtom, sidebarLabelAtom } from './atoms';

function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
  const label = useAtomValue(sidebarLabelAtom);

  return <button onClick={() => setSidebarOpen((v) => !v)}>{label}</button>;
}
```

- `useAtom` returns a `[value, setValue]` pair, like `useState` — that's intentional; an atom is meant to feel like component state that happens to be shareable.
- `useAtomValue`/`useSetAtom` subscribe to just the read or just the write half, which is Jotai's equivalent of Zustand's selector — use them when a component only reads or only writes.
- Derived atoms (`atom((get) => ...)`) are Jotai's version of `computed`/derived state (`state-overview.md`), except the dependency can itself be a shared, cross-tree atom.

## Picking between them

- **Zustand** if you think in terms of a small number of named stores with clear actions — closer to a Redux-lite mental model, easy to reason about as "the app's state objects." Good default when a team is new to external state libraries.
- **Jotai** if the state naturally decomposes into many small, independent, often-derived values, or you want fine-grained subscriptions without hand-writing selectors — good fit when a lot of cross-tree state is computed from other cross-tree state.
- Both are lightweight, don't require a `Provider` wrapping the whole app for the basic case (Jotai does support one for scoping/testing), and both work outside React components when needed. Neither replaces `server-state.md` or `url-state.md` — use this file only for the state that has nowhere else to live.
