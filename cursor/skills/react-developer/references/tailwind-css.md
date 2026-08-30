# Tailwind CSS: v4 Default Styling Layer

Tailwind v4 is the **default styling approach** for this skill. It moved to a CSS-first configuration model — there is no `tailwind.config.js` by default, no PostCSS setup to wire up, and no content-globbing to configure. Reach for it first; only drop to [CSS Modules](css-modules.md) when a case demands it.

## Setup in a Vite Project

Install the package and the dedicated Vite plugin — there is no `postcss.config.js` or `autoprefixer` needed.

```bash
npm install tailwindcss @tailwindcss/vite
```

Register the plugin in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

## CSS-First Configuration

A single import replaces the old `@tailwind base; @tailwind components; @tailwind utilities;` trio. Put this in `src/index.css` and import it once from `main.tsx`.

```css
/* src/index.css */
@import "tailwindcss";
```

- Tailwind automatically scans your project files for class names — there is no `content: []` array to maintain.
- Do **not** generate a `tailwind.config.js`. It still works if present (for plugins or legacy needs), but it is not the default and should not be scaffolded for a new project.

## Theming with `@theme`

Design tokens (colors, fonts, spacing, breakpoints) are defined as CSS custom properties inside an `@theme` block, directly in your CSS file.

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.72 0.19 149);
  --font-display: "Satoshi", "sans-serif";
  --breakpoint-3xl: 1920px;
}
```

- Every token becomes both a utility class (`bg-brand-500`, `font-display`, `3xl:grid-cols-4`) and a plain CSS variable (`var(--color-brand-500)`) you can use in Motion animations or inline styles.
- Extending vs. overriding: adding a new `--color-*` key extends the default palette; redefining `--color-blue-500` overrides it. There is no `theme.extend` wrapper to reason about — everything you write in `@theme` is additive unless the name collides.

## Using Tokens in Components

```tsx
export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-500 px-3 py-1 text-sm font-display text-white">
      {children}
    </span>
  );
}
```

## Variants and Responsive Design

Variants stack as prefixes in a fixed order (responsive → state → pseudo-element) and work the same as v3 — only the config model changed.

```tsx
<button className="rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-400 md:px-6">
  Save
</button>
```

## Arbitrary Values and `@utility`

For one-off values, use square-bracket syntax rather than reaching for inline `style`. For a genuinely reusable custom utility, define it with `@utility` instead of `@layer utilities`.

```css
@utility scrollbar-hidden {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

```tsx
<div className="h-[calc(100vh-4rem)] w-[420px] scrollbar-hidden" />
```

## Gotchas

- v3-style `@tailwind base/components/utilities` directives are gone — a lone `@import "tailwindcss"` replaces all three.
- `tailwind.config.js` is opt-in, not scaffolded. If a project has one, treat it as a deliberate escape hatch (plugin registration, JS-driven theme), not the normal path.
- Class-name strings must stay statically analyzable (no `` `bg-${color}-500` `` template interpolation) — Tailwind's scanner does static extraction, not runtime evaluation.
- Prefer composing utilities directly in JSX over `@apply`; reach for `@apply` only when the same utility cluster repeats across many unrelated components.
