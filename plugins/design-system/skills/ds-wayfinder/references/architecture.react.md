# Architecture Doc — React Examples

> Template/decision rules live in `architecture.md` (agnostic). This file is React primitive wiring and naming only. Names follow `naming.className` and `{conventions}`; the libraries below are examples when `sources.primitives` lists them — wire whatever discovery chose.

## Component Hierarchy

```
{Prefix}{Name} (root / trigger owner)
├── {Prefix}{Name}Panel (overlay panel)
│   ├── {Prefix}{Name}Option (repeated item)
│   └── ...
└── use{Prefix}{Name}Trigger (behavior hook applied to trigger element)
```

## Primitive Wiring

| Primitive | Purpose | Import |
|---|---|---|
| `useOverlayPosition` / Radix `Popper` | Position the panel relative to trigger | `react-aria` / `@radix-ui/react-popper` |
| `FocusScope` / Radix `FocusScope` | Trap focus inside open panel | `react-aria` / `@radix-ui/react-focus-scope` |
| `useFocusManager` | Arrow-key navigation between options | `react-aria` |

### Overlay positioning strategy (if applicable)

```tsx
const { overlayProps } = useOverlayPosition({
  targetRef: triggerRef,
  overlayRef: panelRef,
  placement: 'bottom start',
  shouldFlip: true,
});
```

## State Management

| State | Representation | Transitions |
|---|---|---|
| `isOpen` | `useState(false)` | `open()` → true, `close()` / Escape → false |
| `activeIndex` | `useState(-1)` | Arrow keys, reset on close |
| `selectedValue` | `useState` / derived via `useMemo` | Set on option select |

## Data Flow

```
User action (click trigger)
  → handleOpen()
    → setIsOpen(true)
    → Overlay/Portal renders panel
    → FocusScope activated
    → useFocusManager initialized with options

User action (arrow key)
  → focusManager.focusNext() / focusPrevious()
    → activeIndex updates
    → active option gets focus

User action (Enter / click option)
  → setSelectedValue(option.value)
  → onValueChange(option.value)
  → handleClose()
```

## Justification Reference

Reference the equivalent component from `sources.references` if one exists — see `primitives.react.md` for the adaptation table.
