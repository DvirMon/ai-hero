# Modern Color

## Prefer token functions over raw color functions — but know the modern syntax

Design tokens (see [tokens.md](tokens.md)) should be the first choice for any color. The functions below matter when defining those tokens themselves, or for one-off cases a token genuinely doesn't cover (e.g. deriving a hover state at generation time).

## `color-mix()` — derive a variant instead of hardcoding a second color

```css
/* BAD: a hand-picked hardcoded hover color */
.button:hover { background: #1a2533; }

/* GOOD: derive from the token itself */
.button:hover {
  background: color-mix(in oklch, var(--role-token-fill-brand) 85%, black);
}
```

## Modern color spaces (`oklch`, `oklab`) — perceptually uniform

`oklch()` is preferred over `hsl()`/`rgb()` when defining a new token palette — lightness steps look visually even, and it supports a wider gamut than sRGB.

```css
:root {
  --role-token-fill-brand: oklch(55% 0.18 250);
}
```

Don't retrofit an existing `hsl`/`rgb`-based token palette to `oklch` without design sign-off — the values aren't a 1:1 numeric swap, they need to be re-picked in the new space.

## `light-dark()` — theme-aware value in one declaration

Requires `color-scheme` to be set on the root so the browser knows which value to pick:

```css
:root {
  color-scheme: light dark;
}

.card {
  background: light-dark(var(--role-token-surface-light), var(--role-token-surface-dark));
}
```

Only reach for `light-dark()` when the project doesn't already solve theming via a token-swap mechanism (e.g. a `[data-theme]` attribute that redefines the same token name) — don't run two theming strategies at once.

## Relative color syntax — derive from an existing color's components

```css
/* Take an existing token and only change its alpha */
.overlay {
  background: rgb(from var(--role-token-fill-brand) r g b / 40%);
}
```
