# Avoid Global Styles

Keep styles component-scoped by default. Only add to a global stylesheet when the style must genuinely apply app-wide, and nest it under a container class rather than a bare selector:

```css
/* BAD: bare global selector */
.my-component { color: red; }

/* GOOD: component-scoped file */
.my-component { color: var(--role-token-content-danger); }

/* Exception: if a global style is truly needed, nest it */
.app-container {
  .nested-global-class { /* styles */ }
}
```
