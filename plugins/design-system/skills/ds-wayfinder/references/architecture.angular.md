# Architecture Doc — Angular Examples

> Template/decision rules live in `architecture.md` (agnostic). This file is Angular wiring and naming only. Class names follow `naming.className` and `{conventions}`; the CDK below is the example when `sources.primitives` lists it — wire whatever discovery chose.

## Component Hierarchy

```
{Prefix}{Name}Component (host directive / container)
├── {Prefix}{Name}PanelComponent (overlay panel)
│   ├── {Prefix}{Name}OptionComponent (repeated item)
│   └── ...
└── {Prefix}{Name}TriggerDirective (applied to trigger element)
```

## Primitive Wiring (CDK example)

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

Reference the equivalent component from `sources.references` if one exists — see `primitives.angular.md` for the adaptation table.
