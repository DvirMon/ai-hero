# Accessibility (CSS-Owned Concerns)

ARIA attributes, `alt` text, and `aria-describedby` wiring are template/markup concerns, not CSS — see the framework's own a11y guidance for those. This file covers only what CSS itself controls.

## Never remove focus indication without replacing it

```css
/* BAD: kills keyboard focus visibility */
:focus { outline: none; }

/* GOOD: keep default, or replace with an equally visible custom style */
:focus-visible {
  outline: 2px solid var(--role-token-border-focus);
  outline-offset: 2px;
}
```

## Respect reduced-motion preference

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Contrast via tokens, not arbitrary colors

Text/background pairs must resolve to token pairs the design system has already contrast-checked (e.g. a `content` token paired with its matching `fill` token) — never hand-pick a color that happens to "look readable."

## Touch target sizing

Interactive elements need a minimum hit area regardless of visual size — pad via CSS rather than shrinking the click target to match a small icon:

```css
.icon-button {
  min-width: 4.4rem;
  min-height: 4.4rem;
}
```

## Forced-colors / high-contrast mode

Don't rely purely on `background-color` to convey state in a way that disappears under `forced-colors: active` — verify borders/outlines still communicate boundaries:

```css
@media (forced-colors: active) {
  .selected {
    border: 2px solid CanvasText;
  }
}
```
