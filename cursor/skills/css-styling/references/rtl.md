# Logical CSS Properties (RTL Support)

```css
/* BAD: Physical properties */
.container {
  margin-left: 16px;
  padding-right: 8px;
  border-right: 1px solid var(--role-token-border);
}

/* GOOD: Logical properties */
.container {
  margin-inline-start: 16px;
  padding-inline-end: 8px;
  border-inline-end: 1px solid var(--role-token-border);
}
```

## Common mappings

- `margin-left` → `margin-inline-start`
- `margin-right` → `margin-inline-end`
- `padding-left` → `padding-inline-start`
- `padding-right` → `padding-inline-end`
- `border-left` → `border-inline-start`
- `border-right` → `border-inline-end`

Only apply this in projects that actually need RTL support — check the project's i18n/locale config first.
