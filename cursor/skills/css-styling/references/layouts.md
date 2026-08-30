# Layouts (CSS Display Properties)

Prefer `display: flex` / `display: grid` over `display: table` or float-based layout for arranging content — element choice (which HTML tag to use) is a template concern, not CSS; this file covers only the CSS side.

## Flexbox

```css
.row {
  display: flex;
  gap: 1.6rem;
  align-items: center;
  justify-content: space-between;
}
```

## CSS Grid

```css
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.6rem;
}
```

## `gap` works on flex too — stop using margin-hacks for spacing between items

```css
/* BAD: margin on every child except the last */
.row > * + * { margin-inline-start: 1.6rem; }

/* GOOD */
.row { display: flex; gap: 1.6rem; }
```

## `auto-fit`/`auto-fill` + `minmax()` — responsive grid without a media query

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.6rem;
}
```

`auto-fit` collapses empty tracks (items stretch to fill the row); `auto-fill` keeps empty tracks at their minimum size (items don't stretch). Use `auto-fit` unless the layout specifically needs to preserve a fixed number of visual columns.

## Subgrid — align a nested grid's tracks to its parent

Use when a child grid's rows/columns need to line up with the parent's tracks (e.g. cards in a grid whose internal title/body/footer rows must all align across cards of different content length):

```css
.card-grid {
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
}
```

Without `subgrid`, each card's internal rows size independently and misalign across cards.

## Container-relative responsive layout

For a component (not the viewport) driving its own layout changes, see [responsive.md](responsive.md)'s container-queries section instead of a media query here.

Reserve `display: table` / `table-layout` for actual tabular data styling, not layout.
