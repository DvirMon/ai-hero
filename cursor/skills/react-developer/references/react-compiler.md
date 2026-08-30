# React Compiler

The React Compiler automatically memoizes components and values at build time, so hand-written `useMemo`, `useCallback`, and `React.memo` are mostly unnecessary in new code. Write plain, idiomatic React; let the compiler optimize it.

## What Gets Auto-Memoized

- **Components** — re-renders are skipped when a component's props haven't meaningfully changed, without wrapping it in `memo()`.
- **Values computed in components/Hooks** — expensive calculations and object/array literals get cached across renders like a `useMemo` would.
- **Callbacks** — inline functions (including ones created inline in JSX, like `() => handleClick(item)`) get stable identity automatically.

```tsx
// Before the compiler: manual memoization
const ExpensiveList = memo(function ExpensiveList({data, onClick}: Props) {
  const processed = useMemo(() => expensiveProcessing(data), [data]);
  const handleClick = useCallback((item: Item) => onClick(item.id), [onClick]);
  return (
    <ul>
      {processed.map((item) => (
        <li key={item.id} onClick={() => handleClick(item)}>
          {item.label}
        </li>
      ))}
    </ul>
  );
});

// With the compiler: identical behavior, no manual memoization
function ExpensiveList({data, onClick}: Props) {
  const processed = expensiveProcessing(data);
  const handleClick = (item: Item) => onClick(item.id);
  return (
    <ul>
      {processed.map((item) => (
        <li key={item.id} onClick={() => handleClick(item)}>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

- The compiler does **not** memoize plain JavaScript functions that live outside components/Hooks, even if they're expensive — only code the compiler recognizes as component/Hook bodies is instrumented.
- `React.memo`/`useMemo`/`useCallback` still work fine if present; they just become redundant in most new code rather than harmful.

## Purity Discipline the Compiler Relies On

The compiler assumes your components and Hooks follow the [Rules of React](https://react.dev/reference/rules) — most importantly:

- Components/Hooks are **idempotent**: given the same props/state, rendering produces the same output, with no side effects during render.
- **Never mutate props, state, or any value read during a previous render.** Treat them as read-only; derive new values instead.
- Local `let` variables created and mutated *entirely within* the current render are fine — the concern is mutating something that outlives or was read from outside the current call.

```tsx
// Violates purity — mutates a prop during render
function BadList({items}: {items: Item[]}) {
  items.sort((a, b) => a.order - b.order); // mutates the prop array in place
  return <ul>{items.map((i) => <li key={i.id}>{i.label}</li>)}</ul>;
}

// Compiler-safe — derives a new array instead of mutating
function GoodList({items}: {items: Item[]}) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  return <ul>{sorted.map((i) => <li key={i.id}>{i.label}</li>)}</ul>;
}
```

When code violates these rules, the compiler doesn't guess — it **bails out** (skips optimizing that component/Hook) rather than risk changing behavior.

## What "Opting Out" Looks Like

The compiler silently skips compilation for a function when it detects something that might violate the Rules of React, such as:

- Mutating props, state, or other values captured from an outer render.
- Patterns that rely on manual memoization *for correctness* rather than performance (e.g. an effect that behaves differently if a dependency's object identity happens to change between renders).
- Unstable or unusual control flow the compiler can't statically prove is safe to optimize.

A bailout is silent by default — your code still works, it just doesn't get the automatic memoization for that component.

## Debugging / Detecting a Bailout

1. **ESLint plugin** (`eslint-plugin-react-compiler`) — run it to surface Rules-of-React violations the compiler would also trip on; fixing lint errors is usually enough to un-bail a component.
2. **React DevTools memo badge** — an optimized component shows a "Memo ✨" badge in the Components panel; a component missing the badge did not get compiled.
3. **Isolate with the `"use no memo"` directive** — temporarily force-disable compilation for a suspect function to check whether a bug is compiler-related or a pre-existing issue:

```tsx
function ProblematicComponent() {
  "use no memo"; // TODO: remove once root-caused
  // ...
}
```

If removing compilation changes nothing, the bug isn't compiler-related. If behavior changes, look for a purity/mutation violation the compiler was papering over or bailing out on.

4. **Strip manual memoization temporarily** — remove existing `useMemo`/`useCallback`/`memo` calls to confirm the app still behaves correctly relying purely on the compiler; this exposes cases where old code depended on manual memoization for *correctness* (a Rules-of-React smell) rather than performance.

## Directives

- `"use no memo"` at the top of a function body — opt that function out of compilation. Use for debugging or isolating incompatible third-party-facing code; treat as temporary and comment why.
- `"use memo"` at the top of a function body — force compilation (relevant mainly in `annotation` mode, or to override heuristics in `infer` mode).
- Either directive placed at the top of a file (before imports) applies module-wide; a function-level directive overrides the file-level one.
