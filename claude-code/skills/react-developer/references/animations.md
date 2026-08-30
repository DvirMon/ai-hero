# Animations: CSS-First, Motion for Orchestration

Default to native CSS for anything that is a simple state-to-state transition. Reach for **Motion** (the library formerly published as `framer-motion`, now published as `motion`) only when you need orchestration, gestures, exit animations, or layout transitions that CSS cannot express.

## CSS Transitions for Simple State Changes

If an animation is "this property changes when this class/state changes," `transition` is enough — no library, no JS.

```tsx
import { useState } from 'react';

export function ExpandableCard() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="overflow-hidden rounded-lg transition-[max-height] duration-300 ease-out"
      style={{ maxHeight: open ? 400 : 80 }}
      onClick={() => setOpen((o) => !o)}
    >
      Card content…
    </div>
  );
}
```

- Prefer Tailwind's `transition-*`, `duration-*`, `ease-*` utilities over hand-written `@keyframes` for one-off effects.
- Animate only `transform` and `opacity` where possible — they run on the compositor thread and stay smooth without triggering layout.

## CSS Keyframe Animations

For a self-contained, non-interactive animation (spinners, skeleton shimmer, toast entrances), a `@keyframes` block in a CSS Module is simpler than pulling in a JS library.

```css
/* Spinner.module.css */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin 0.8s linear infinite;
}
```

## When CSS Isn't Enough

Reach for Motion when you need:

- **Orchestration** — staggering children, sequencing multiple elements off one trigger.
- **Exit animations** — animating a component *out* before it unmounts (CSS alone can't delay unmounting).
- **Gestures** — drag, hover, and tap animations tied to pointer physics.
- **Layout animations** — animating size/position changes that come from a layout shift, not an explicit style change.
- **Interruptible, physics-based motion** — spring-driven transitions that need to react naturally if interrupted mid-animation.

## Setup

```bash
npm install motion
```

```tsx
import { motion } from 'motion/react';
```

- The package is `motion`, imported from `motion/react` for the React bindings — not `framer-motion`. The component and hook API is unchanged from Framer Motion, so existing examples online still apply even where they show the old import.

## Basic Motion Component

```tsx
import { motion } from 'motion/react';

export function FadeInCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-lg bg-white p-4 shadow-md"
    >
      {children}
    </motion.div>
  );
}
```

## Gestures

`whileHover` and `whileTap` describe a target state that's active only while the gesture is happening — no event handlers or state needed.

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="rounded-md bg-brand-500 px-4 py-2 text-white"
>
  Submit
</motion.button>
```

## Exit Animations with `AnimatePresence`

Wrap conditionally-rendered children in `AnimatePresence` so Motion can animate them out before React removes them from the DOM.

```tsx
import { AnimatePresence, motion } from 'motion/react';

export function Toast({ visible, message }: { visible: boolean; message: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="rounded-md bg-slate-900 px-4 py-2 text-white"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Layout Animations

Add `layout` and Motion automatically animates any change in size or position caused by a re-render (e.g. a list item reordering, a sibling being removed).

```tsx
<motion.li layout className="rounded-md bg-slate-100 p-3">
  {item.label}
</motion.li>
```

## Respecting `prefers-reduced-motion`

Wrap the app (or a subtree) in `MotionConfig` to disable motion globally for users who've opted out at the OS level — do this once near the root, not per-component.

```tsx
import { MotionConfig } from 'motion/react';

<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

## Gotchas

- Don't animate `motion.div` with both Motion's `animate` prop and a conflicting CSS `transition` on the same property — Motion should own the properties it's driving.
- `AnimatePresence` requires each animated child to have a stable, unique `key` — without it, exit animations won't trigger correctly.
- Layout animations recalculate on every affected re-render; scope `layout` to elements that actually reposition, not entire lists, to avoid unnecessary work.
