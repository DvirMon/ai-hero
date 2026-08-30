# Transitions, Animation, and View Transitions

## Transitions — prefer over JS for simple state changes

```css
.button {
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.button:active {
  transform: scale(0.97);
}
```

Only transition compositor-friendly properties (`transform`, `opacity`) for anything performance-sensitive — transitioning `width`/`height`/`top`/`left` triggers layout on every frame.

```css
/* BAD: triggers layout each frame */
.panel { transition: width 0.3s; }

/* GOOD: compositor-only */
.panel { transition: transform 0.3s, opacity 0.3s; }
```

## `@keyframes` / `animation` — for anything with multiple steps or that loops

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

## Always respect `prefers-reduced-motion`

Every non-trivial transition/animation needs a reduced-motion fallback — see [accessibility.md](accessibility.md) for the media query. Don't skip this because "it's just a hover effect" — vestibular-disorder users are affected by small transforms too.

## View Transitions API — cross-DOM-state and cross-page animation

Replaces most custom enter/leave animation plumbing for state changes and page navigations, where supported. Falls back to an instant swap in browsers without support — no polyfill needed, just don't rely on it for functionality.

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

/* Named transition for a specific element */
.hero-image {
  view-transition-name: hero;
}
```

```js
document.startViewTransition(() => {
  // DOM update that should be animated between old and new state
  updateDOM();
});
```

Check the framework reference file for how the framework's router integrates view transitions (e.g. Angular Router's `withViewTransitions()`), since triggering them by hand alongside a framework router usually double-fires.
