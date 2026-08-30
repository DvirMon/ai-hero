---
name: css-styling
description: TRIGGER before any write/edit touching styling — .css/.scss files, inline JSX style props, Angular [style.*]/[class.*] host/template bindings, or @Component styles/styleUrls. Apply CSS and styling using design tokens instead of hardcoded values. Covers Tailwind usage, flex/grid/subgrid layouts, container queries, fluid responsive units, native nesting, :has()/:is()/:where(), cascade layers, modern color (oklch/color-mix/light-dark), transitions/view-transitions, design-token override APIs, RTL/logical properties, and DS-component styling rules. Token names resolve per-project; falls back to Angular Material semantic naming when a project has no established token vocabulary.
---

# CSS & Styling Standards

Apply CSS and styling using design tokens and framework-appropriate style scoping.

> Framework-specific encapsulation/host-selector syntax lives in `references/styles.angular.md` or `references/styles.react.md` — load the one matching the current project. Every other topic below routes to its own reference file; read only the ones relevant to the task at hand.

## When to Use

Use this skill when:
- Writing component styles
- Fixing CSS issues
- Converting hardcoded values to design tokens
- Implementing layouts
- Building or overriding a DS (design-system) component's styling API
- User asks about CSS best practices

## Core Principles

1. **CSS Variables** — Use design tokens, never hardcode raw values
2. **Tailwind First** — Prefer Tailwind classes for utilities
3. **No Inline Styles** — Use CSS/Tailwind classes
4. **Flex/Grid Layouts** — Avoid HTML tables for layout
5. **Scoped Styles** — Rely on the framework's default style encapsulation; never disable it
6. **Logical CSS** — Use logical properties for RTL support
7. **Match the project's spacing base** — confirm the root font-size / rem base before assuming px↔rem ratios
8. **Reach for modern CSS before JS or a media-query workaround** — container queries over resize listeners, `:has()` over a JS-toggled class, `clamp()` over breakpoint-jump values, native nesting/`@layer` over specificity hacks
9. **Resolve conflicts via layer order, not specificity escalation** — when an override doesn't apply, reach for `@layer` ordering or a token/override-API seam first; never fix it by adding an ID selector, `!important`, or piling on extra classes

## Topics

When working on styling, consult the reference matching the task:

- **Design tokens**: resolving a project's real token names, the Angular Material fallback vocabulary when none exists, colors/font-size/radius examples. Read [tokens.md](references/tokens.md)
- **Tailwind**: utility-first usage, Tailwind-vs-custom-CSS decision framework. Read [tailwind.md](references/tailwind.md)
- **Layouts**: `display: flex`/`display: grid` property usage, `gap`, `auto-fit`/`auto-fill` + `minmax()`, subgrid (element choice is a template concern, not covered here). Read [layouts.md](references/layouts.md)
- **Responsive**: container queries (prefer over media queries for component-level responsiveness), fluid values with `clamp()`, dynamic viewport units (`dvh`/`svh`/`lvh`), `aspect-ratio`, `object-fit`. Read [responsive.md](references/responsive.md)
- **Modern selectors & cascade**: `:has()`, `:is()`/`:where()`, native CSS nesting, cascade layers (`@layer`) for explicit override ordering. Read [modern-selectors.md](references/modern-selectors.md)
- **Animation & transitions**: compositor-friendly transitions, `@keyframes`, respecting reduced-motion, the View Transitions API. Read [animation.md](references/animation.md)
- **Modern color**: `color-mix()`, `oklch`/`oklab`, `light-dark()` theming, relative color syntax. Read [color.md](references/color.md)
- **Component override API**: the two-level (internal vs consumer-overridable) CSS custom property pattern for any styleable/overridable component. Read [override-api.md](references/override-api.md)
- **Style encapsulation**: never piercing a child's internal styles from outside; when a framework escape hatch is acceptable at app level. Read [encapsulation.md](references/encapsulation.md)
- **DS components**: stricter styling rules for shared design-system components — root-as-styling-root, zero-tolerance encapsulation piercing, token sourcing, Figma token-path mapping. Read [ds-components.md](references/ds-components.md)
- **Z-index**: global layer tokens, relative layering via `calc()`, local tokens inside stacking contexts, top-layer/Popover API exception for viewport-relative overlays. Read [z-index.md](references/z-index.md)
- **Elevation**: global shadow-tier tokens, semantic reuse across components, theme-aware shadows, inset/bevel as separate token sets. Read [elevation.md](references/elevation.md)
- **RTL / logical properties**: `margin-inline-*`/`padding-inline-*`/`border-inline-*` mappings, when it applies. Read [rtl.md](references/rtl.md)
- **Global styles**: when a global stylesheet is acceptable and how to scope it. Read [global-styles.md](references/global-styles.md)
- **Translations**: extracting hardcoded copy into the project's i18n system. Read [translations.md](references/translations.md)
- **Accessibility**: CSS-owned concerns only — focus-visible styling, reduced-motion, contrast via tokens, touch-target sizing, forced-colors mode (ARIA/alt text are template concerns, not covered here). Read [accessibility.md](references/accessibility.md)
- **Stylesheet audits**: build-budget checks, when a value is worth tokenizing, reporting size after changes. Read [audit.md](references/audit.md)
- **Framework syntax (Angular)**: host bindings vs `Renderer2`, `ViewEncapsulation`, `:host` as root, translation/a11y binding syntax. Read [styles.angular.md](references/styles.angular.md)
- **Framework syntax (React)**: CSS Modules scoping, no inline `style` objects, root-class-as-root, translation/a11y binding syntax. Read [styles.react.md](references/styles.react.md)
