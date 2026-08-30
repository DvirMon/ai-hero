# Tailwind Usage

```html
<!-- GOOD: Tailwind utility classes -->
<div class="flex gap-8 p-24">
  Content
</div>

<!-- BAD: Inline styles -->
<div style="display: flex; gap: 8px; padding: 24px;">
  Content
</div>
```

## Tailwind vs Custom CSS — Decision Framework

**Use Tailwind (remove the custom class) when:**
- Single-property utilities: `display`, `flex-direction`, `align-items`, `justify-content`, `gap`, `margin`, `padding`, `color`, `background-color`, `width`, `height`
- All CSS properties in the class have a Tailwind equivalent
- No pseudo-elements (`::placeholder`, `::before`, `::after`)
- No nested state selectors (`&:hover`, `&.error`, `&.active`)

**Keep in CSS/SCSS when:**
- Has responsive `@media` queries
- Has pseudo-elements (`::placeholder`, `::before`)
- Has nested state selectors (`&.error`, `&.active`)
- Has CSS custom property overrides
- Is a global class override
- Requires element selectors
- The specific value isn't in the project's Tailwind theme config

**Spacing/color scale, unit ratio (e.g. 1rem = 10px vs 16px), and any Tailwind class-to-token mapping are project-specific** — check the project's `tailwind.config` before assuming a scale.

## className Ordering

Order utilities structure → state/metadata → interaction → cosmetic, so long strings stay scannable and override intent is visible without re-reading the whole class list:

```html
<div class="flex p-24 aria-invalid:border-danger hover:bg-brand-subtle shadow-md">
```

Structure (`flex`, `p-24`) → metadata (`aria-invalid:*`) → interaction (`hover:*`, `focus-visible:*`) → cosmetic (`shadow-*`, non-state `bg-*`).
