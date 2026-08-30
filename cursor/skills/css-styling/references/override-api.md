# Component Token Override API (Two-Level Pattern)

Applies to any component meant to be styled/overridden by a consumer — most strictly to DS components (see [ds-components.md](ds-components.md)). Root-element selector and consumer-side syntax differ per framework — see `styles.angular.md` / `styles.react.md`.

## Level 1: Internal tokens (NOT consumer-overridable)

The component's own implementation detail — resolved from the project's token file or the Material fallback (see [tokens.md](tokens.md)). Consumers never touch these directly.

## Level 2: Component-scoped tokens (consumer-overridable)

Declared on the component's root, with defaults pointing to Level 1 tokens:

```css
/* Consumer-overridable tokens — name is illustrative */
--component-bg: var(--role-token-fill);
--component-max-height: 25.6rem;

/* Structural styles consume the tokens */
background-color: var(--component-bg);
max-height: var(--component-max-height);
```

## Rules

- Expose only intentional override points (5-7 tokens max per component)
- Consumer overrides MUST use the project's own tokens (or Material fallback tokens), not arbitrary values
- No `panelClass`/escape-hatch props — token-only override API
- Document what IS and ISN'T overridable
