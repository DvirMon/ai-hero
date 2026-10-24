# Component API Design (Framework-Agnostic)

> Framework-specific syntax lives in the sibling file for your target framework (e.g. `component-api.angular.md`). This file covers the design decisions that hold regardless of framework — read it first, then the framework file for the concrete syntax.

> Placeholders (`{prefix}`, `{Prefix}`, `{selector}`) resolve from the design-system config. Where
> `{conventions}` § API conventions differs from an example here (slot style, behavior-unit naming),
> the conventions doc wins.

## Core Principle: Composability

Design system components are composable atoms. The API should let consumers combine components without workarounds.

**Right mental model:** "This component provides a structured layout — consumers bring their own content."

If any slot could ever contain an icon, a link, or another component — use content projection (children/slots/`ng-content`, whichever your framework calls it), not a typed string input. Converting a `string` prop to projected content later is a breaking change. Bias toward composability.

Behavior reused across components → extract to a standalone behavior unit (directive, hook, composable, mixin — framework term varies) and compose it into the host, rather than extending a component class to add behavior.

---

## Pattern Selection

```
Does the feature add behavior TO an existing element (not own its template)?
  └─ YES → Pattern 1: Behavior-as-feature

Does the content need to escape the DOM tree (overlay, stacking context)?
  └─ YES → Pattern 2: Portal-based content (dialog, drawer, snack bar)

Does the component have a floating panel triggered by a separate element?
  └─ YES → Pattern 3: Trigger + panel

Does the component have distinct named sub-parts with their own behavior/state?
  └─ YES → Pattern 4: Composable sub-components

Does the component have distinct named content regions (header, body, actions)?
  └─ YES → Pattern 5b: Named content slots

Otherwise → Pattern 5a: Simple content projection
```

---

## Pattern 1 — Behavior-as-feature

A standalone behavior unit reads from / writes to the host element (via element reference or the framework's host-binding mechanism). It never renders its own template — it only augments an existing element's behavior.

**Examples:** autosize behavior on a `<textarea>`, autocomplete behavior on an `<input>`, editable behavior on any heading element.

---

## Pattern 2 — Portal-based content

Check for an existing internal overlay/portal abstraction in the codebase before reaching for a raw platform overlay primitive.

Never expose portal internals in the public API. `open`, an "opened" event, and a "closed" event are sufficient surface area.

---

## Pattern 3 — Trigger + panel

A behavior unit on the trigger element, a component for the floating panel. The trigger does not own the panel's DOM — it only references the panel and forwards events.

```
<input data-{prefix}-autocomplete="panel" />
<{prefix}-autocomplete-panel id="panel">...</{prefix}-autocomplete-panel>
```

---

## Pattern 4 — Composable sub-components

Use when parts have independent state, optional presence, or need to be repeated. The parent exposes itself as a shared context (dependency-injection token, React context, Vue provide/inject — whichever applies); children read from that context rather than being directly imported/coupled to the parent's internals.

```
Parent component:
  - registers itself as a shared context value
  - holds a collection of registered children (e.g. items = [])
  - exposes a register(child) method

Child component:
  - reads the parent context (optional — must work standalone if parent absent)
  - registers itself with the parent on init
```

```
<{prefix}-card>
  <{prefix}-card-title>Budget Overview</{prefix}-card-title>
  <{prefix}-card-label color="success">+12%</{prefix}-card-label>
</{prefix}-card>
```

Export all sub-components from the public API — they are independently usable, not just internal parts.

---

## Pattern 5a — Simple content projection

Use when the component provides a layout shell and consumers bring the content.

```
<div class="container">{content}</div>
```

---

## Pattern 5b — Named slots

Use when parts are content placeholders only (no independent state). Prefer attribute/name-based selection over requiring a specific child element type.

```
Component template:
  <div class="header">{slot: title}</div>
  <div class="body">{default slot}</div>
  <div class="actions">{slot: actions}</div>

Consumer usage:
  <{prefix}-card>
    <span slot="title">My Title</span>
    <p>Rich content including <{prefix}-icon key="info" /></p>
    <button slot="actions">Save</button>
  </{prefix}-card>
```

---

## Figma Variant → API Mapping

| Figma variant | API pattern |
|---|---|
| Enum (`Type=Primary,Secondary`) | typed enum prop/input, e.g. `appearance: 'primary' \| 'secondary'` (default `'primary'`) |
| Boolean toggle (`Show icon=True/False`) | boolean prop/input, e.g. `showIcon: boolean` (default `false`) |
| Static label / title | named content slot |
| Variable body content | default content slot |
| Action buttons / links | named content slot (e.g. `actions`) |
| Color/intent (`Color=Danger,Success`) | typed enum prop/input, e.g. `color: 'neutral' \| 'danger' \| 'success'` |
| Hover/focus state | CSS pseudo-class — not a prop/input |
| Disabled state | boolean prop/input, e.g. `disabled: boolean` (default `false`) |

Default values must match the Figma "default" variant.

---

## Public API Exports

### Simple component

Export the component and its public types from the package's public entry point. Don't leave types importable only via deep/internal paths.

### Multi-atomic family (Pattern 4)

Export each piece individually **and** a named grouping for convenience import (e.g. `{Prefix}Stepper` bundling `StepperComponent`, `StepComponent`, `StepperLabel`). The group name is the feature — never the only import path; individual pieces must remain independently importable.

---

## API Completeness Check

- [ ] Pattern selected from the decision tree — not defaulted to plain content projection
- [ ] Every Figma variant dimension mapped to a prop/input (or confirmed as a CSS-only state)
- [ ] No `string` prop where content could grow to include rich elements
- [ ] All sub-components and types exported individually from the public entry point
- [ ] If multi-atomic: convenience group export exists alongside individual exports
- [ ] Default values match Figma defaults
