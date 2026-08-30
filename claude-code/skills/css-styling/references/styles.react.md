# Styles — React Conventions

> Agnostic conventions (tokens, Tailwind, layouts, override-API pattern, logical CSS, DS rules) are split across `references/*.md` — see `SKILL.md`'s Topics table. This file covers React-specific style encapsulation and binding syntax only. Token names in examples are illustrative — resolve real names per [tokens.md](tokens.md).

## No Inline `style` Objects

Never use the `style` prop for static styling — use CSS Modules or Tailwind classes. `style` is reserved for genuinely dynamic, runtime-computed values (e.g. a measured height, a CSS custom property override).

```tsx
// BAD: static inline style
<div style={{ display: 'flex', gap: '8px', padding: '24px' }}>
  Content
</div>

// GOOD: CSS Module / Tailwind
<div className={styles.root}>Content</div>
<div className="flex gap-8 p-24">Content</div>

// OK: style reserved for dynamic values / token overrides
<div style={{ '--icon-color': iconColor } as CSSProperties}>Content</div>
```

## CSS Modules Scoping (Default)

```css
/* Component.module.css — automatically scoped */
.root {
  color: var(--role-token-content);
}
```

```tsx
import styles from './Component.module.css';

<div className={styles.root}>...</div>
```

## `:global()` Piercing (App-Level Only, Last Resort)

App-level code may use `:global()` as a scoped last resort — but per [encapsulation.md](encapsulation.md), prefer exposing a CSS custom property instead.

### DS Components: No `:global()` Piercing — Ever

A DS component never reaches into a child component's internal CSS Module classes, not even through `:global()`.

```css
/* BAD: reaching into a child's internal class */
.parent :global(.child-icon) {
  color: red;
}

/* GOOD: expose a CSS custom property, let the child consume it */
.parent {
  --icon-color: var(--role-token-content-danger);
}
/* In the child's own CSS Module: */
/* .icon { color: var(--icon-color, var(--role-token-content-default)); } */
```

## Root Selector

### App-level components

Style the component's outermost rendered element normally — no special constraint beyond the encapsulation rules above.

### DS components: Root Class as Styling Root

Style the component's root class directly — never add a wrapper element just for styling.

```css
/* Component.module.css */

/* GOOD */
.root {
  display: flex;
  align-items: center;
  border-radius: var(--role-token-radius-md);
}

/* BAD: wrapper element for styling purposes */
/* .wrapper { display: flex; ... } */
```

```tsx
<div className={styles.root}>...</div>
```

## Component Token Override API — React Syntax

```css
/* Component.module.css */
.root {
  /* Consumer-overridable tokens — name is illustrative */
  --component-bg: var(--role-token-fill);
  --component-color: var(--role-token-content);

  background: var(--component-bg);
  color: var(--component-color);
}
```

Consumers override via inline style (for the CSS custom property only) or a wrapping class:

```tsx
<Component style={{ '--component-bg': 'var(--role-token-fill-brand)' } as CSSProperties} />
```

## Translations

Verify the project's actual i18n library before assuming this syntax (e.g. `react-i18next`):

```tsx
// BAD: Hardcoded text
<button>Save Changes</button>

// GOOD: Translated
const { t } = useTranslation();
<button>{t('common.save_changes')}</button>
```

## Accessibility — React Binding Syntax

```tsx
<input
  id="email"
  aria-describedby="email-error"
  className={emailInvalid ? styles.error : undefined}
/>
{emailInvalid && (
  <span id="email-error">{t('errors.invalid_email')}</span>
)}
```
