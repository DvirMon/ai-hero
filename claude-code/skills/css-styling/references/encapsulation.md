# Style Encapsulation (App-Level Default)

Don't reach into a child component/element's internal styles from outside its own stylesheet, even when the framework offers a scoped escape hatch. Expose a CSS custom property instead:

```css
/* BAD: piercing encapsulation from outside */
.parent .child-internal-element { color: red; }

/* GOOD: expose a CSS variable, let the child consume it */
.parent {
  --icon-color: var(--role-token-content-danger);
}
/* In the child's own stylesheet: */
/* .icon { color: var(--icon-color, var(--role-token-content-default)); } */
```

App-level code may use a framework's scoped escape hatch as a last resort if one exists — DS components may not (see [ds-components.md](ds-components.md)). Whether a scoped escape hatch exists, and its syntax, is framework-specific — see `styles.angular.md` / `styles.react.md`.
