# Architecture Doc — Angular Examples

> Template/decision rules live in `architecture.md` (agnostic). This file is Angular CDK wiring and naming only.

## Component Hierarchy

```
Atera<Name>Component (host directive / container)
├── Atera<Name>PanelComponent (overlay panel)
│   ├── Atera<Name>OptionComponent (repeated item)
│   └── ...
└── Atera<Name>TriggerDirective (applied to trigger element)
```

## CDK Wiring

| CDK Primitive | Purpose | Import |
|---|---|---|
| `Overlay` | Position the panel relative to trigger | `@angular/cdk/overlay` |
| `FocusTrap` | Trap focus inside open panel | `@angular/cdk/a11y` |
| `FocusKeyManager` | Arrow-key navigation between options | `@angular/cdk/a11y` |

### Overlay positioning strategy (if applicable)

```typescript
this.overlay.position()
  .flexibleConnectedTo(this.triggerRef)
  .withPositions([
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top',    overlayX: 'start', overlayY: 'bottom' }, // flip
  ]);
```

## State Management

| State | Signal | Transitions |
|---|---|---|
| `isOpen` | `signal(false)` | `open()` → true, `close()` / Escape → false |
| `activeIndex` | `signal(-1)` | Arrow keys, reset on close |
| `selectedValue` | `linkedSignal(...)` | Set on option select |

## Data Flow

```
User action (click trigger)
  → open() method
    → isOpen.set(true)
    → CDK Overlay creates panel
    → FocusTrap activated
    → FocusKeyManager initialized with options

User action (arrow key)
  → FocusKeyManager.onKeydown()
    → activeIndex updates
    → active option gets focus

User action (Enter / click option)
  → selectedValue.set(option.value)
  → valueChange.emit()
  → close()
```

## Justification Reference

Reference the Angular Material equivalent if applicable — see `primitives.angular.md` for the adaptation table.
