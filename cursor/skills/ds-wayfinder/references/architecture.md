# Architecture Doc — Complex Component Planning (Framework-Agnostic)

> Framework-specific primitive wiring and naming live in the sibling file for your target framework (e.g. `architecture.angular.md`). This file covers the template/decisions that hold regardless of framework.

Generate `docs/architecture.md` inside the component folder when the user confirms the component is complex enough to warrant it. Use this for components with overlays, multi-part structures, complex state machines, or rich keyboard management.

## When to Generate

Ask the user. Typical triggers:
- Uses a portal/overlay primitive
- Has a trigger + panel two-part structure (e.g. autocomplete, select, tooltip, dropdown)
- Has a state machine with 3+ states and transitions (e.g. stepper, wizard)
- Has complex focus management (trap, return, sequential)
- Has multiple coordinated child components

## Template

```markdown
# Architecture: {prefix}-<name>

**Status:** Draft
**PRD:** [docs/prd.md](prd.md)
**Created:** YYYY-MM-DD

---

## Component Pattern

### Structure
<!-- Choose one and justify -->
- **Single component** — all logic in one unit, suitable for self-contained components
- **Two-part: trigger + panel** — behavior unit on the trigger element, separate panel component (use for overlays, dropdowns, popovers)
- **Multi-component** — coordinated parent + children (use for tabs, stepper, accordion)

### Justification
Why this pattern? Reference an equivalent reference-library component if applicable (see framework file's adaptation table).

---

## Component Hierarchy

```
<Name>Container (root / trigger owner)
├── <Name>Panel (overlay panel)
│   ├── <Name>Option (repeated item)
│   └── ...
└── <Name>Trigger (behavior unit applied to trigger element)
```

---

## Primitive Wiring

See framework file for the concrete primitive library table (e.g. CDK for Angular).

| Concern | Purpose |
|---|---|
| Overlay/portal | Position the panel relative to trigger |
| Focus trap | Trap focus inside open panel |
| Roving/key manager | Arrow-key navigation between options |

---

## State Management

| State | Representation | Transitions |
|---|---|---|
| `isOpen` | boolean state | `open()` → true, `close()` / Escape → false |
| `activeIndex` | numeric state | Arrow keys, reset on close |
| `selectedValue` | derived/linked state | Set on option select |

### State transition rules
- Cannot open when `disabled === true`
- Closing always resets `activeIndex` to -1
- [add component-specific rules]

---

## Data Flow

```
User action (click trigger)
  → open() method
    → isOpen set to true
    → overlay/portal creates panel
    → focus trap activated
    → key manager initialized with options

User action (arrow key)
  → key manager handles keydown
    → activeIndex updates
    → active option gets focus

User action (Enter / click option)
  → selectedValue set
  → valueChange event emitted
  → close()
```

---

## Open Questions

List anything unresolved that needs a decision before implementation:

- [ ] Should the panel width match the trigger width, or be auto?
- [ ] How does the component behave inside a scrolling container?
- [ ] [add component-specific open questions]
```

## Rules for Generating

- **Component pattern must be decided before any code** — changing from single to two-part mid-implementation is costly
- **State machine must be complete** — every state and every transition, including error states
- **Open questions must be resolved** by the developer before Phase 5 starts — the architecture doc is the place to surface them, not mid-implementation
- Derive primitive wiring from Phase 1 (primitive selection) — do not re-research
- See framework file for concrete primitive imports and component-class naming
