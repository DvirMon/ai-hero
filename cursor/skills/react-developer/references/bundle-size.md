# Bundle Size

A splitting strategy only pays off if you can see what's actually in each chunk. Audit the bundle before optimizing, then guard against the tree-shaking traps that silently bloat "should be small" dependencies.

## Auditing Bundle Composition

Use `vite-bundle-visualizer` for a quick, zero-config look — it runs a production build and opens a treemap of every chunk:

```bash
npx vite-bundle-visualizer
```

For a persistent, CI-friendly view, wire `rollup-plugin-visualizer` (Vite builds on Rollup's plugin interface, so Rollup plugins work directly) into `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
});
```

- Run `vite build` and open `dist/stats.html` — look for any single dependency taking up disproportionate space relative to what it's used for.
- Check gzip/brotli size, not raw size — that's what actually crosses the network, and some libraries compress very differently than their raw size suggests.
- Re-run the visualizer after adding any new dependency. Catching a bloated import at PR time is cheaper than finding it in a later audit.

## Tree-Shaking Traps

Tree-shaking removes unused exports at build time, but only when the bundler can *prove* an export is unused and side-effect-free. These patterns defeat that proof silently — the code still works, it just ships more bytes than it should.

### Barrel File Re-exports

A barrel (`index.ts` that re-exports everything from a feature folder) is convenient to import from, but it forces the bundler to evaluate the whole barrel module graph to figure out what's actually reachable — and with deep or circular re-export chains, bundlers often give up and keep everything.

```ts
// ❌ features/orders/index.ts — barrel re-exporting the whole feature
export * from './OrderList';
export * from './OrderDetail';
export * from './useOrderTotals';

// A consumer importing one thing pulls in the whole barrel's module graph:
import { useOrderTotals } from '@/features/orders'; // may retain OrderList + OrderDetail too
```

```ts
// ✅ Import directly from the module that defines it
import { useOrderTotals } from '@/features/orders/useOrderTotals';
```

- Barrels aren't forbidden for organizing public API surface — the trap is *depending* on the barrel path internally within the same app instead of importing the concrete module.
- If a barrel is load-bearing for a library's public API, keep it side-effect-free (no top-level code that runs on import) so bundlers can still shake it.

### Importing Whole Libraries Instead of Subpaths

Some libraries ship as one big module even though you only use a slice of it. Importing the package root pulls in the whole thing unless the library is authored with per-function ESM entry points.

```ts
// ❌ Pulls in all of lodash's CommonJS build — not tree-shakeable
import { debounce } from 'lodash';

// ✅ Subpath import — only this function's code is bundled
import debounce from 'lodash/debounce';
// or use the ESM-native build, which supports named-import shaking directly
import { debounce } from 'lodash-es';
```

- Same trap with icon packs (`import { Icon } from 'some-icon-library'` vs. `some-icon-library/Icon`) and date libraries — prefer `date-fns` (per-function modules) over `moment` (monolithic, not tree-shakeable at all).
- Check a library's `package.json` for an `"exports"` map with granular subpaths, or a `"module"` field pointing at an ESM build — that's the signal it supports real tree-shaking.

### Side-Effect-Full Imports

Bundlers keep any module marked (or assumed) to have side effects, whether or not you use its exports — because removing it could change runtime behavior. Every `import './polyfill'` or `import './some.css'` is a side-effectful import by nature, and an inaccurate `package.json` can mark an entire library that way by mistake.

```json
// package.json — declares a library free of import side effects,
// letting bundlers drop unused exports entirely
{
  "sideEffects": false
}
```

```json
// If some files DO have real side effects (CSS, polyfills), list them explicitly
// instead of setting sideEffects: false for the whole package
{
  "sideEffects": ["**/*.css", "./src/polyfills.ts"]
}
```

- If a dependency has no `sideEffects` field, bundlers must assume every file has side effects — worth checking before adopting a new dependency for a hot path.
- Within app code, avoid top-level statements that run on import (registering things, mutating globals) in modules you also want to be tree-shakeable — that top-level code is exactly what forces the bundler to keep the module.

## Practical Checklist

- Run the visualizer before and after adding a dependency; reject anything whose footprint is out of proportion to the feature it enables.
- Prefer libraries with an ESM `"exports"` map and `"sideEffects": false` over CommonJS-only or monolithic alternatives.
- Import from concrete modules/subpaths in hot paths; treat barrels as a public-API convenience, not an internal import target.
