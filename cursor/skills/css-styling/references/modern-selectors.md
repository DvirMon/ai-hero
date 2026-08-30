# Modern Selectors, Nesting, and Cascade Layers

## `:has()` — parent/relational selector

Lets a rule react to a descendant's state without JS. Widely supported now — prefer it over a JS-toggled class for pure presentational reactions.

```css
/* Style a form field's wrapper when it contains an invalid input */
.field:has(input:invalid) {
  border-color: var(--role-token-border-danger);
}

/* Style a card differently when it contains an image */
.card:has(img) {
  grid-template-columns: auto 1fr;
}
```

## `:is()` / `:where()` — reduce selector repetition

`:is()` and `:where()` group alternatives into one selector. The only difference is specificity: `:is()` takes the specificity of its most specific argument; `:where()` always has zero specificity.

```css
/* BAD: repeated compound selector */
header h1, header h2, header h3,
footer h1, footer h2, footer h3 { margin: 0; }

/* GOOD */
:is(header, footer) :is(h1, h2, h3) { margin: 0; }
```

Use `:where()` specifically when you want the grouped selector to add **zero specificity** — e.g. base/reset styles that should be trivially overridable by anything else:

```css
:where(ul, ol) { margin: 0; padding: 0; }
```

## Native CSS Nesting

Modern browsers support nesting without a preprocessor. Still fine to use SCSS nesting if the project already uses SCSS — don't mix conventions within one file.

```css
.card {
  padding: 1.6rem;

  & .card-title {
    font-weight: var(--role-token-font-weight-bold);
  }

  &:hover {
    box-shadow: var(--role-token-shadow-md);
  }

  @media (min-width: 768px) {
    padding: 2.4rem;
  }
}
```

Rule: a nested selector starting with a type selector (`div`, `h1`) needs the `&` prefix or must be wrapped — `& div { }` not `div { }` — to avoid it being parsed as a new top-level rule in some contexts.

## Cascade Layers (`@layer`) — deliberate override ordering

Use layers to make override intent explicit instead of relying on source order + specificity wars, especially when mixing a reset, a design system, and app overrides.

```css
@layer reset, tokens, components, utilities;

@layer reset {
  * { margin: 0; }
}

@layer components {
  .button { background: var(--role-token-fill-brand); }
}

@layer utilities {
  .u-hidden { display: none; }
}
```

Later-declared layers always win over earlier ones, regardless of specificity within each layer — this is what makes override intent explicit. Unlayered styles beat all layered styles, so keep one-off overrides unlayered on purpose only when that's the intent.
