---
name: react-developer
description: Generates React code and provides architectural guidance for greenfield React 19 client-side (Vite SPA) projects. Trigger for best practices on reactivity (useState, useReducer, use API, Actions), logic reuse (custom hooks, HOCs, render props), architecture (Feature-Sliced Design, three-layer components), state separation (server/URL/global/local), forms, routing, concurrent features, compiler-era performance, styling (Tailwind, CSS Modules), or build tooling.
license: MIT
metadata:
  author: Dvir Monajem
  version: '4.0'
  target: React 19 (greenfield, client-side SPA, Vite)
---

# React Developer — v19 (Greenfield)

> **Role in the pipeline:** this skill is the *knowledge* SSOT for React conventions — it does
> not own execution. When `/implementation` works a task plan, it dispatches each step to the
> sdlc **`implementer` agent** with the skills the step's project names in
> `.claude/workflow.json` — this one, for a React project. Read
> this skill directly for ad-hoc React guidance; go through the agent for planned work, so each
> step lands with its acceptance checks intact.

This skill targets NEW React 19 client-side (Vite SPA) projects with no legacy code. All guidance is written for React 19 running in the browser. Server Components, Server Functions, `use cache`, and file-based routing are out of scope — do not generate them. If a project is server-first (Next.js/RSC), this skill does not apply.

Because the codebase starts clean, there is no migration protocol. If a forbidden pattern ever appears, it was introduced in error — fix it inline as part of whatever task you're doing. See [forbidden-patterns.md](references/forbidden-patterns.md).

## General Guidelines

1. Follow the React style guide and community best practices for maintainability and performance.
2. After generating code, run `tsc --noEmit` and `vite build`. Fix any errors before proceeding.
3. Before generating any component, hook, or state logic, check [forbidden-patterns.md](references/forbidden-patterns.md) — it lists the outdated idioms the model defaults to out of habit.
4. Before finishing a component, check whether any inline lifecycle logic (a `useRef` + `useEffect` acquire/release pair, a listener, a timer) or inline object-builder has its own coherent scope separable from the host — reuse is not required to justify extraction. If the repo has a `.claude/rules/extract-encapsulated-logic.md`, follow it.

## 1. Component Fundamentals & Composition

* Fundamentals: Anatomy, JSX, props, core concepts. Read [components.md](references/components.md) (includes minimal DOM nesting best practices)
* Props: Typing, defaults, children, `ref` as a prop. Read [props.md](references/props.md)
* Custom Hooks: The default logic-reuse pattern. Read [custom-hooks.md](references/custom-hooks.md)
* HOCs: Narrow exceptions only (structural wrapping, third-party APIs). Read [hocs.md](references/hocs.md)
* Render Props: Narrow exceptions only (JSX-coupled behavior). Read [render-props.md](references/render-props.md)
* Compound Components: Shared-state UI primitives (Tabs, Accordion). Read [compound-components.md](references/compound-components.md)

**For opinionated composition patterns that scale** — avoiding boolean-prop proliferation, designing flexible component APIs, and context-based state coupling — consult the **[vercel-composition-patterns](/vercel-composition-patterns)** skill. It provides detailed rules and examples for these high-leverage patterns.

## 2. Rendering & Reconciliation

* Rendering: Conditional rendering, lists, fragments, portals. Read [rendering.md](references/rendering.md)
* Keys & Lists: Key stability and reconciliation behavior. Read [keys-and-lists.md](references/keys-and-lists.md)
* Component Boundaries: When and how to split a component. Read [component-boundaries.md](references/component-boundaries.md)

## 3. State Management Taxonomy

State is not one thing — classify by type before choosing a tool. Read each file for its bucket:

* Local State: `useState`/`useReducer`, derived state, colocation. Read [state-overview.md](references/state-overview.md)
* Server State: TanStack Query — caching, mutations, invalidation. Read [server-state.md](references/server-state.md)
* URL State: Filters, tabs, pagination via router search params. Read [url-state.md](references/url-state.md)
* Global UI State: Zustand/Jotai for cross-tree client state. Read [global-state.md](references/global-state.md)

## 4. Concurrent Features

* Transitions: `useTransition`, `useDeferredValue`. Read [transitions.md](references/transitions.md)
* Optimistic State: `useOptimistic` for instant feedback during Actions. Read [optimistic-state.md](references/optimistic-state.md)

## 5. Compiler-Era Performance

* React Compiler: What it auto-memoizes, purity discipline, debugging when it opts out. Read [react-compiler.md](references/react-compiler.md)
* Manual Memoization: The narrow exception — external referential-equality needs only. Read [manual-memoization.md](references/manual-memoization.md)

## 6. Async Data & Suspense

* `use()` API: Unwrapping promises/context in render. Read [use-api.md](references/use-api.md)
* Suspense Boundaries: Placement, avoiding waterfalls, pairing with error boundaries. Read [suspense-boundaries.md](references/suspense-boundaries.md)

## 7. Forms & Actions

* Form Actions: `useActionState`, `useFormStatus`, pending/error/optimistic handling. Read [forms.md](references/forms.md)
* Validation: React Hook Form + Zod for complex/dynamic forms. Read [form-validation.md](references/form-validation.md)

## 8. Routing

* React Router: Routes, nested routes, data loaders, `<Outlet>`. Read [react-router.md](references/react-router.md)
* Navigation: `<Link>`, `useNavigate`. Read [navigation.md](references/navigation.md)
* Route Guards: Protected routes and auth boundaries. Read [route-guards.md](references/route-guards.md)

## 9. Styling

* Tailwind CSS: v4 default styling layer. Read [tailwind-css.md](references/tailwind-css.md)
* CSS Modules: Scoped styles, avoiding global leakage. Read [css-modules.md](references/css-modules.md)
* Animations: CSS-first, Framer Motion for orchestration. Read [animations.md](references/animations.md)

## 10. Testing

These two files cover test *mechanics* only. For **what deserves a test** — the contract model,
what to test, what to skip, mocking boundaries — load the **`unit-test`** skill; it is the SSOT
for that policy and this skill does not duplicate it.

* Fundamentals: Vitest + React Testing Library. Read [testing-fundamentals.md](references/testing-fundamentals.md)
* Component Testing: Queries, `user-event`, testing custom hooks. Read [component-testing.md](references/component-testing.md)

## 11. Build & Bundle Performance

* Code Splitting: Route/component-level splitting, lazy loading. Read [code-splitting.md](references/code-splitting.md)
* Bundle Size: Dependency auditing, tree-shaking traps. Read [bundle-size.md](references/bundle-size.md)
* Tooling: Vite, Biome/ESLint, React Compiler setup. Read [tooling.md](references/tooling.md)

## 12. Architecture & Project Structure

* Feature-Sliced Design: Layer contract, folder templates, dependency direction. Read [architecture.md](references/architecture.md)
* Forbidden Patterns: The generation-guardrail table. Read [forbidden-patterns.md](references/forbidden-patterns.md)

If you require deeper documentation not found in the references above, read the documentation at `https://react.dev/reference/react`.

## 13. Source Comments

Do not improvise JSDoc/`//` comments. The contract is
[doc-contracts/jsdoc.md](../../conventions/doc-contracts/jsdoc.md) — two channels
(consumer-facing `/** */`, maintainer `//`), with word/line budgets and a "never in either
channel" list (decision history, D-numbers, rejected alternatives, restating the signature).
Read it before writing a comment block; when a file's comments need a full pass rather than a
single block, run the `source-docs` skill over that path instead of hand-editing.
