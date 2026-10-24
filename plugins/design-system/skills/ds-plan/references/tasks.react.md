# Task Generation — steps.md — React Examples

> Phase structure and rules live in `tasks.md` (agnostic). This file is React-specific checklist items only.

## Phase 2 — Component function (React checklist)

- [ ] Scaffold function component with `forwardRef` (if it exposes a DOM ref) and typed props interface
- [ ] Add theme class and selector class to `className`
- [ ] Declare all props with types and defaults (from PRD API Summary)
- [ ] Declare all callback props (`onX`)
- [ ] Wire variant/state classes via `clsx`/`classnames` on the root element
- [ ] Wire ARIA attributes on the root element (from roles-map / accessibility planning)
- [ ] [if architecture.md exists] Implement state via `useState`/`useReducer` and transitions
- [ ] [if primitive-backed] Wire React Aria/Radix hooks, overlay/focus management

## Phase 3 — Template (React checklist)

- [ ] Add default `children` slot
- [ ] Add named slot props for [title / actions / ...] (from PRD content slots)
- [ ] Add internal structural elements (icon, spinner, etc. — from Figma anatomy)
- [ ] Wire conditional rendering / `.map()` for repeated/conditional regions

## Phase 4 — Styles (React checklist)

- [ ] Declare CSS custom property override API on `.root` (from design-tokens.md or styles planning)
- [ ] Style `.root` base layout (display, align, border-radius, etc.)
- [ ] Style each variant class using role tokens (from Figma token mapping)
- [ ] Style each state (`:hover`, `:focus-visible`, `.disabled`)
- [ ] [if motion.md] Add transition declarations + `prefers-reduced-motion` override
