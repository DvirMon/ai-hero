# Elevation / Shadow Token System (Design System Enforcement)

Never allow a raw/arbitrary `box-shadow` value for elevation in DS component CSS. Every elevation `box-shadow` must resolve to a token — no exceptions, no hand-picked blur/spread numbers.

## Rule 1 — Global elevation tokens

Define a small, fixed set of elevation tiers as CSS custom properties. Most systems need only 4-6 tiers (card, raised, overlay, modal) — resist adding a tier per component:

```css
:root {
  --elevation-0: none;
  --elevation-100: 0 1px 2px oklch(0% 0 0 / 8%);
  --elevation-200: 0 2px 8px oklch(0% 0 0 / 12%);
  --elevation-300: 0 8px 24px oklch(0% 0 0 / 16%);
  --elevation-400: 0 16px 48px oklch(0% 0 0 / 20%);
}
```

## Rule 2 — Tokens are semantic, not per-component

Reuse the same tier across every component at that visual depth (all cards use `--elevation-100`, all modals use `--elevation-300`) — don't invent a `--card-shadow` that happens to duplicate `--elevation-100`'s value. Two names for one value is the same drift problem as an untracked magic number.

```css
/* BAD: a component-private shadow that duplicates a tier */
.card { box-shadow: 0 1px 2px rgba(0,0,0,0.08); }

/* GOOD: reuse the tier token */
.card { box-shadow: var(--elevation-100); }
```

## Rule 3 — Elevation implies stacking order, but isn't a z-index substitute

A higher elevation tier usually correlates with a higher `z-index`, but the two token systems are independent — don't derive `z-index` from an elevation tier with `calc()`. Set both explicitly; see [z-index.md](z-index.md) for the stacking-order system.

## Rule 4 — Theme-aware elevation

Shadows read as too heavy on dark surfaces at the same opacity as light surfaces. If the project themes via `light-dark()` or a `[data-theme]` token swap (see [color.md](color.md)), the elevation tokens themselves should swap too, not just the surface color:

```css
:root {
  --elevation-200: 0 2px 8px oklch(0% 0 0 / 12%);
}

[data-theme='dark'] {
  --elevation-200: 0 2px 8px oklch(0% 0 0 / 32%);
}
```

## Rule 5 — Inset and bevel are separate token sets

Don't overload the elevation scale with inner shadows (pressed/inset states) or dimensional bevels — give those their own small token set (e.g. `--inset-100`) so an elevation tier always means "cast below."

## Enforcement

- Lint rule: flag any literal `box-shadow` value not referencing a `var(--elevation-*)`/`var(--inset-*)` token (Stylelint `declaration-property-value-disallowed-list` or custom rule).
- Code review checklist item: "shadow traced to an elevation token, not a hand-picked value."
- New component checklist: does this need a new visual depth, or does an existing tier already fit? Adding a 7th tier is a design decision, not a CSS one — flag it rather than inventing one inline.
