# Task Generation — steps.md — Angular Examples

> Phase structure and rules live in `tasks.md` (agnostic). This file is Angular-specific checklist items only.

## Phase 2 — Component class (Angular checklist)

- [ ] Scaffold `@Component` decorator with selector, `OnPush`, `host` base class
- [ ] Add theme class and selector class to `host`
- [ ] Declare all inputs with types and defaults (from PRD API Summary)
- [ ] Declare all outputs
- [ ] Wire variant/state classes in `host` bindings
- [ ] Wire ARIA attributes in `host` bindings (from roles-map / accessibility planning)
- [ ] [if architecture.md exists] Implement state signals and transitions
- [ ] [if CDK] Inject CDK services, wire overlay/focus management

## Phase 3 — Template (Angular checklist)

- [ ] Add `<ng-content>` default slot
- [ ] Add named slots for [title / actions / ...] (from PRD content slots)
- [ ] Add internal structural elements (icon, spinner, etc. — from Figma anatomy)
- [ ] Wire `@if` / `@for` control flow for conditional regions

## Phase 4 — Styles (Angular checklist)

- [ ] Declare CSS custom property override API on `:host` (from design-tokens.md or styles planning)
- [ ] Style `:host` base layout (display, align, border-radius, etc.)
- [ ] Style each variant class using role tokens (from Figma token mapping)
- [ ] Style each state (`:host:hover`, `:host:focus-visible`, `:host.disabled`)
- [ ] [if motion.md] Add transition declarations + `prefers-reduced-motion` override
