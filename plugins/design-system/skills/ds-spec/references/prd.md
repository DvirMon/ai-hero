# PRD — Component Planning Document

Generate `docs/prd.md` inside the component folder after Phase 2 planning is complete. This is the primary context document — it captures what the component is, why it exists, and what it must do. All subsequent implementation phases reference it.

> Placeholders resolve from the design-system config (`${CLAUDE_PLUGIN_ROOT}/contracts/ds-config.md`).

## When to Generate

Always. Every DS component gets a `docs/prd.md`, regardless of complexity.

## Template

```markdown
# PRD: {selector}

**Status:** Draft  
**Figma:** [link]  
**Created:** YYYY-MM-DD

---

## What

One paragraph. What is this component? What visual/interaction pattern does it implement?

## Why

Why does this component need to exist in the DS? What gap does it fill? What problem does it solve for consumers?

## Scope

> Each version ships as a separate PR. Pull the version buckets directly from `docs/decisions.md` — do not guess.

### V1 — Core
- [ ] List of features assigned to V1 in the scope triage

### V2 — Enhancement
- [ ] List of features assigned to V2 in the scope triage

### V3 — Additional *(omit section if no V3 features)*
- [ ] List of features assigned to V3 in the scope triage

### V4 — Nice-to-have *(omit section if no V4 features)*
- [ ] List of features assigned to V4 in the scope triage

---

## User Stories

*(Optional — include when the component has more than one consumer-facing interaction pattern; omit for trivial/single-purpose components.)*

1. As a design-system consumer, I want [capability], so that [outcome].
2. As a design-system consumer, I want [capability], so that [outcome].

## Component Overview

| Property | Value |
|---|---|
| Selector | `{selector}` |
| Location | `{componentPath}` |
| Primitive | [library + primitive, or "none"] |
| Complexity | Simple / Moderate / Complex |

---

## Internal DS Components

> Sourced from the `internalDsComponents` field in the Phase 1 Discovery Summary. **Mandatory** — write "none" if the component contains no existing DS components. Each row MUST include the exact import path captured during Phase 1 discovery.

| DS Component | Selector | Import path | Used for |
|---|---|---|---|
| [one row per Discovery Summary entry] | [selector from source] | [import path from its export] | [purpose] |

**Scaffolding rule:** the component scaffolder MUST import and use every component listed here using the exact `Import path` value in this table. Do NOT reimplement their markup or behaviour from scratch, and do not guess import paths from component names.

---

## Variants & States

| Dimension | Values | Default |
|---|---|---|
| appearance | primary, secondary, ... | primary |
| size | sm, md, lg | md |
| [other] | ... | ... |

**States:** default, hover, focus, active, disabled, [error, loading, empty — if applicable]

---

## API Summary

### Inputs
| Name | Type | Default | Description |
|---|---|---|---|
| `variant` | `Variant` | `'primary'` | Visual style |

### Outputs
| Name | Type | Description |
|---|---|---|
| `dismissed` | `void` | Emitted when user closes the component |

### Content slots
| Slot | Selector | Description |
|---|---|---|
| Default | (none) | Main content |
| Title | `[slot=title]` | Header region |

---

## Accessibility

| Requirement | Value |
|---|---|
| ARIA role | `dialog` / `button` / `listbox` / ... |
| Keyboard contract | [summary from `ds-a11y-speccer` output — authoritative source, Phase 3] |
| Focus on open | First focusable element / container |
| Focus on close | Trigger element |

---

## Acceptance Criteria

- [ ] All Figma variants implemented
- [ ] All states visually correct (hover, focus, disabled, error)
- [ ] Fully keyboard operable
- [ ] ARIA attributes correct and dynamic
- [ ] Tokens only — every color/shadow/radius/spacing value from `tokens.allowed` (or the component's own custom properties when the DS has no tokens); nothing from `tokens.forbidden`
- [ ] Root element matches `{conventions}` § Component shape (incl. `{themeClass}` when set)
- [ ] All internal DS components from the table above are imported and used — none reimplemented
- [ ] Public API exported per `{conventions}` § Types and exports
- [ ] Code Connect published *(only when the Figma project config has `codeConnect.available: true`)*
```

## Rules for Generating

- **What / Why must be specific** — not "a reusable component" but "a dismissable notification banner used to surface non-blocking system messages at the top of a page"
- **Out of scope is mandatory** — prevents scope creep. Pull from the Figma design description or from conversations about future enhancements
- **API Summary derives directly** from Phase 2 planning output — do not re-invent, copy from the planning results
- **Acceptance Criteria** are the gate for Phase 6 (Verify & Ship) — they must be checkable, not vague
- **User Stories, when included, are per-interaction, not per-prop** — one story per distinct way a consumer uses the component, not one per input/output
