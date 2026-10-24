# Motion & Animation — DS Components

## When to Add Motion

Add animation only when the design specifies it or the interaction benefits from spatial
continuity (a panel appearing from its trigger, an item expanding).

**Do not animate** for its own sake — static components (badges, dividers, banners without
dismiss) have no animation.

## Principles

- **Purposeful** — reinforce where an element came from and where it goes.
- **Brief** — 150–250ms; never above 300ms without a documented reason.
- **Reduced motion** — always honour `prefers-reduced-motion`.

## Token-Based Durations

Durations and easings come from tokens matching `tokens.motion`, defined in `tokens.sources`.
Never hardcode them in a rule body.

```css
/* ✅ motion tokens */
transition: opacity var(--motion-duration-fast) var(--motion-easing-standard);

/* ❌ hardcoded */
transition: opacity 200ms ease-in-out;
```

When the DS has no motion tokens (`tokens.motion: []`), declare component-level custom
properties on the root with these fallback values, and use those:

| Use | Duration | Easing |
|---|---|---|
| Panel open/close | `150ms` | `ease-out` / `ease-in` |
| Item hover highlight | `100ms` | `ease-out` |
| Chevron rotation | `150ms` | `ease-in-out` |
| Dismiss / fade out | `200ms` | `ease-in` |

## Common Patterns

`--{selector}-motion-duration` below is a component-level custom property declared on the root,
defaulting to a motion token (or a fallback value above).

### Panel open/close

```css
.panel {
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity var(--{selector}-motion-duration) ease-out,
    transform var(--{selector}-motion-duration) ease-out;

  &.open {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Reduced motion override

Always alongside any animation:

```css
@media (prefers-reduced-motion: reduce) {
  .panel,
  .chevron {
    transition: none;
  }
}
```

Use the DS's reduced-motion mixin instead when `{conventions}` § Styling names one.

## What to Note in the Discovery Summary

During Phase 1, record under `Motion:` whether the panel/overlay animates in (and from where),
whether anything rotates or scales on state change, and whether there is a dismiss or fade.
