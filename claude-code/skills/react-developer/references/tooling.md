# Tooling

The baseline toolchain for a new React 19 SPA: Vite for build/dev-server, Biome (or ESLint) for lint/format, and the React Compiler enabled from day one so manual memoization never becomes a habit.

## Vite as Build Tool & Dev Server

Scaffold with the official template — it wires up TypeScript, `@vitejs/plugin-react`, and a working dev server with HMR out of the box:

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app && npm install
```

```bash
npm run dev     # dev server with Fast Refresh
npm run build   # production build to dist/
npm run preview # serve the production build locally
```

- `@vitejs/plugin-react` (v6+) handles JSX transform and Fast Refresh using oxc/Rust instead of Babel, which is why enabling the React Compiler — a Babel plugin — needs an extra Babel bridge (below), not the plugin's old inline `babel` option.
- Keep `vite.config.ts` as the single source of truth for plugins, path aliases, and dev-server proxy config — avoid separate webpack-era config files that don't apply to Vite.

## Linting & Formatting: Biome or ESLint

Pick one. Biome is a single Rust binary that replaces both ESLint and Prettier with one fast, zero-config-friendly tool — the default choice for a new project unless the team already standardizes on ESLint's plugin ecosystem (e.g. a specific framework's required ESLint rules).

```bash
npm install -D --save-exact @biomejs/biome
npx @biomejs/biome init
```

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.5.4/schema.json",
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "formatter": { "enabled": true, "indentStyle": "space" },
  "javascript": { "formatter": { "quoteStyle": "single" } }
}
```

```bash
npx @biomejs/biome check --write ./src   # lint + format, applying safe fixes
```

If ESLint is required instead (broader rule/plugin ecosystem, existing shared config):

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
```

- Either way, add `eslint-plugin-react-hooks`'s `recommended-latest` preset (or Biome's equivalent hooks rules) — it also carries the React Compiler's lint rules, which flag purity violations the compiler would otherwise silently skip-compile around.
- Run the linter in CI, not just as an editor integration — compiler opt-outs and hook-rule violations should fail a build, not just show a squiggly line.

## Enabling the React Compiler

The React Compiler auto-memoizes components and hooks at build time, replacing most manual `useMemo`/`useCallback`/`React.memo`. Install it as a dev dependency:

```bash
npm install -D babel-plugin-react-compiler@latest
```

Because `@vitejs/plugin-react` v6+ no longer runs Babel itself, wire the compiler in through `@rolldown/plugin-babel`, using the plugin's `reactCompilerPreset` helper for a preconfigured setup:

```bash
npm install -D @rolldown/plugin-babel
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
});
```

- On an older `@vitejs/plugin-react` (pre-v6, still Babel-based internally), the compiler can instead be enabled inline without the extra dependency:
  ```ts
  react({ babel: { plugins: ['babel-plugin-react-compiler'] } })
  ```
  This form no longer works once the project is on `@vitejs/plugin-react` v6+ — check the installed version before assuming which pattern applies.
- If the project also runs Babel outside Vite (e.g. a separate transpile step), the compiler plugin must run **first** in that pipeline — it needs to analyze un-transformed component/hook code.
- Add the compiler's lint rules via `eslint-plugin-react-hooks`'s `recommended-latest` preset so violations (mutating props, conditional hook calls) surface at lint time instead of as a silent compiler opt-out.
- Verify it's active: install React DevTools, run the app in dev, and look for the "Memo ✨" badge next to compiled component names in the component tree. In the production build output, compiled components import from `react/compiler-runtime`.
- A component can opt out locally with the `"use no memo"` directive at its top — use this only as a temporary escape hatch for a component the compiler mis-compiles, not as a default.
