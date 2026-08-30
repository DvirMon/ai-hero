# Responsive CSS (Modern)

## Container Queries — prefer over media queries for component-level responsiveness

A component that must adapt to the space it's placed in (not the viewport) should query its container, not the viewport. This is the single biggest shift from pre-2023 responsive CSS.

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    grid-template-columns: auto 1fr;
  }
}
```

Use `container-type: inline-size` (not `size`) unless block-axis queries are genuinely needed — `size` forces the container out of normal flow sizing.

## Media Queries — still correct for viewport-level / user-preference concerns

Reserve `@media` for things tied to the viewport or the user's environment, not a component's own layout:

```css
@media (min-width: 768px) { /* viewport breakpoints */ }
@media (prefers-color-scheme: dark) { /* see color.md */ }
@media (prefers-reduced-motion: reduce) { /* see animation.md */ }
@media (pointer: coarse) { /* touch vs mouse input */ }
```

## Fluid values with `clamp()` — avoid breakpoint-jump typography/spacing

```css
/* BAD: fixed size that jumps at each breakpoint */
.title { font-size: 24px; }
@media (min-width: 768px) { .title { font-size: 32px; } }

/* GOOD: fluid scaling between a min and max, driven by viewport width */
.title {
  font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
}
```

`clamp(min, preferred, max)` — the preferred value should be the only one containing a viewport unit (`vw`, `cqw`); min/max stay in fixed units so the value never shrinks below or grows past the design's bounds.

## Viewport units — use the dynamic variants, not legacy `vh`/`vw`

`100vh` doesn't account for mobile browser chrome (address bar) showing/hiding — causes layout jump. Use the dynamic variants for anything meant to fill the visible viewport:

```css
/* BAD on mobile: jumps when the browser chrome collapses */
.full-height { height: 100vh; }

/* GOOD: tracks the actual visible viewport */
.full-height { height: 100dvh; }
```

- `dvh`/`dvw` — dynamic (updates as browser chrome shows/hides) — default choice
- `svh`/`svw` — smallest possible viewport (chrome always shown)
- `lvh`/`lvw` — largest possible viewport (chrome always hidden)

## Container query length units

Inside a container-query context, size relative to the container instead of the viewport:

```css
@container card (min-width: 300px) {
  .card-title { font-size: 1.2cqi; } /* cqi = 1% of container's inline size */
}
```

## `aspect-ratio` — replaces the padding-hack

```css
/* BAD: padding-top percentage hack */
.thumbnail { padding-top: 56.25%; }

/* GOOD */
.thumbnail { aspect-ratio: 16 / 9; }
```

## `object-fit` / `object-position` for media inside a fixed box

```css
img.avatar {
  aspect-ratio: 1 / 1;
  object-fit: cover;
  object-position: center;
}
```
