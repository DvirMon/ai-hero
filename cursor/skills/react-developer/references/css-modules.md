# CSS Modules: Scoped Styles, Avoiding Global Leakage

CSS Modules are the **fallback** to [Tailwind](tailwind-css.md), not a competing default. Reach for them when a component's styling is too complex, too state-driven, or too third-party-entangled for utility classes to stay readable.

## How Scoping Works

Any file named `*.module.css` gets its class names hashed to a unique identifier per component at build time — Vite supports this with zero configuration. Two components can both define `.card` without ever colliding in the compiled output.

```css
/* Card.module.css */
.card {
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
}

.cardHighlighted {
  outline: 2px solid var(--color-brand-500);
}
```

```tsx
import styles from './Card.module.css';

export function Card({ highlighted, children }: { highlighted?: boolean; children: React.ReactNode }) {
  return (
    <div className={highlighted ? `${styles.card} ${styles.cardHighlighted}` : styles.card}>
      {children}
    </div>
  );
}
```

- Imported class names are plain strings (`styles.card === 'Card_card_a1b2c3'`), so TypeScript won't catch a typo like `styles.crad` at compile time unless you add a typed-CSS-modules codegen step.
- Compose conditional class names with `clsx` rather than manual ternary string-building once you have more than two conditions.

```tsx
import clsx from 'clsx';
import styles from './Card.module.css';

<div className={clsx(styles.card, highlighted && styles.cardHighlighted)} />
```

## Composing Classes with `composes`

CSS Modules can compose from another local class or from a global one, keeping shared declarations in one place without a preprocessor.

```css
.baseButton {
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 600;
}

.primaryButton {
  composes: baseButton;
  background: var(--color-brand-500);
  color: white;
}
```

## When to Reach for CSS Modules Instead of Tailwind

- **Complex, highly stateful visuals** — multi-property keyframe animations, gradients with many stops, or pseudo-element-heavy layouts (`::before`/`::after` art) that would produce an unreadable wall of utility classes.
- **Overriding third-party component internals** — a library ships its own class names (e.g. a chart or calendar widget) and you need to target nested selectors Tailwind's utilities can't reach directly.
- **Deep selector composition** — styles that depend on structural relationships (`.parent:has(.child.active) > .grandchild`) read far better as real CSS than as arbitrary-value Tailwind strings.
- **Design tokens still apply** — pull `@theme` CSS variables into your module file (`color: var(--color-brand-500)`) so Tailwind and CSS Modules share one source of truth instead of hardcoding values twice.

```css
.timelineTrack {
  background: linear-gradient(90deg, var(--color-brand-300) 0%, var(--color-brand-600) 100%);
}

.timelineTrack::after {
  content: '';
  position: absolute;
  inset: 0;
  mix-blend-mode: overlay;
}
```

## Overriding a Third-Party Component

```tsx
import styles from './DatePicker.module.css';
import ThirdPartyDatePicker from 'some-date-lib';

// The library exposes a `calendarClassName` prop for exactly this purpose.
<ThirdPartyDatePicker calendarClassName={styles.calendarOverride} />
```

```css
/* DatePicker.module.css */
.calendarOverride :global(.rdp-day_selected) {
  background: var(--color-brand-500);
}
```

- `:global(...)` escapes scoping for a single selector — use it sparingly, and only to reach into markup you don't control.

## Gotchas

- Don't mix CSS Modules and Tailwind utilities on the *same* element for the same concern (e.g. both setting `padding`) — pick one system per property to avoid specificity fights.
- File must end in `.module.css` (not `.css`) or Vite will treat it as a global stylesheet instead of generating scoped exports.
- Prefer CSS Modules over inline `style={{ ... }}` for anything beyond a single dynamic value — modules keep styles static-analyzable and cacheable.
