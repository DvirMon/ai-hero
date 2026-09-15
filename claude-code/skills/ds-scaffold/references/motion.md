# Motion & Animation — DS Components

## When to Add Motion

Add animation only when the design explicitly specifies it or when the interaction pattern benefits from spatial continuity (e.g. a panel that appears from a trigger, a list item that expands).

**Do not animate** for the sake of it — static components (badges, dividers, banners without dismiss) should have no animation.

## DS Motion Principles

- **Purposeful**: animation should reinforce the interaction — where did this element come from, where is it going?
- **Brief**: DS animations are 150–250ms. Never exceed 300ms.
- **Reduced motion**: always respect `prefers-reduced-motion` — skip or reduce all transitions.

## Token-Based Durations

Use DS motion tokens when available. Do not hardcode duration values.

```scss
// ✅ GOOD: use motion tokens
transition: opacity var(--motion-duration-fast) var(--motion-easing-standard);

// ❌ BAD: hardcoded duration
transition: opacity 200ms ease-in-out;
```

Check `{prefix}-roles.scss` for available `--motion-*` tokens. If none exist for your use case, use these standard values as fallback:

| Use | Duration | Easing |
|---|---|---|
| Panel open/close | `150ms` | `ease-out` / `ease-in` |
| Item hover highlight | `100ms` | `ease-out` |
| Chevron rotation | `150ms` | `ease-in-out` |
| Dismiss / fade out | `200ms` | `ease-in` |

## Common Patterns

### Panel open/close

```scss
.panel {
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;

  &.open {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Chevron rotation (accordion, select)

```scss
.chevron {
  transition: transform 150ms ease-in-out;

  :host.open & {
    transform: rotate(180deg);
  }
}
```

### Reduced motion override

Always include this alongside any animation:

```scss
@media (prefers-reduced-motion: reduce) {
  .panel,
  .chevron {
    transition: none;
  }
}
```

Or as a global mixin if one exists in the DS:

```scss
:host {
  @include reduced-motion {
    transition: none;
  }
}
```

## What to Note in Discovery Summary

During Phase 1, look for motion in the Figma prototype or design notes:
- Does the panel/overlay animate in? What direction?
- Does any element rotate or scale on state change?
- Is there a dismiss or fade transition?

Add observed motion to the Discovery Summary under `Motion:` so Phase 4 (styles) can implement it correctly.
