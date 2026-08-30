# Z-Index Token System (Design System Enforcement)

Never allow a raw/arbitrary `z-index` value in DS component CSS. Every `z-index` must resolve to a token — no exceptions, no "just this once."

## Rule 1 — Global layer tokens

Define app-wide stacking layers as CSS custom properties, spaced apart to allow future insertion without renumbering:

```css
:root {
  --z-base: 0;
  --z-sidebar: 100;
  --z-toast: 200;
  --z-popup: 300;
  --z-overlay: 400;
}
```

## Rule 2 — Relative layering via calc()

Elements that must stay locked to a parent layer (e.g. an overlay's backdrop) derive their position with `calc()` instead of getting their own unrelated token:

```css
.overlay-backdrop { z-index: calc(var(--z-overlay) - 1); }
```

## Rule 3 — Local tokens inside stacking contexts

Any component establishing its own stacking context (has its own `z-index`, or `isolation: isolate`) must use local tokens for internal elements — global tokens are meaningless once inside a new context:

```css
--z-bottom: -10;
--z-top: 10;
```

## Rule 4 — Diagnosis before escalation

If an element isn't stacking correctly, the fix is almost never "raise the number." Check for a missing/misunderstood stacking context first.

## Rule 5 — Negative values are allowed

Fine for internal decorative layers (backgrounds, inner glows) once a stacking context is confirmed established on the container.

## Rule 6 — Exception: viewport-relative overlays

Tooltips, popovers, or anything that must sit above *everything* regardless of DOM position should NOT rely on z-index tokens — use the CSS **Popover API / top-layer** instead. Local "top" tokens only guarantee top-of-container, not top-of-page.

## Enforcement

- Lint rule: flag any literal `z-index` value not referencing a `var(--z-*)` token (Stylelint `declaration-property-value-disallowed-list` or custom rule).
- Code review checklist item: "z-index traced to a token, not a magic number."
- New component checklist: does this component establish a stacking context? If yes, define local `--z-top`/`--z-bottom` tokens for it in its own file, don't reuse globals.
