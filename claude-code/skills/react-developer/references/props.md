# Props

Props are the inputs to a component — read-only values passed down from a parent. A component must never mutate its own props; if it needs to change a value, it should own that value as local state or ask the parent to change it.

## Typing Props

Define an explicit `type` (or `interface`) for a component's props and destructure them in the function signature.

```tsx
type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}
```

- Prefer `type` over `interface` for props unless you need declaration merging — either is acceptable, but be consistent within a codebase.
- Mark optional props with `?` and give them a default via destructuring (`variant = "primary"`), not with `defaultProps` (removed for function components in React 19).
- Use union literal types (`"primary" | "secondary"`) instead of `string` for a closed set of variants — it turns typos into compile errors.

## Default Values

Destructuring defaults are the only mechanism for prop defaults on function components.

```tsx
type PageProps = {
  title: string;
  pageSize?: number;
};

function Page({ title, pageSize = 20 }: PageProps) {
  return <h1>{title} — {pageSize} per page</h1>;
}
```

- A default only applies when the prop is `undefined` (not passed, or explicitly passed as `undefined`) — passing `null` does not trigger the default.
- `Component.defaultProps` is deprecated/removed for function components — always use destructuring defaults instead.

## `children`

`children` is just a prop — whatever is nested between a component's opening and closing tags — typed as `React.ReactNode` for "anything renderable."

```tsx
type PanelProps = {
  title: string;
  children: React.ReactNode;
};

function Panel({ title, children }: PanelProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="panel-body">{children}</div>
    </section>
  );
}

// Usage
<Panel title="Settings">
  <p>Any JSX goes here.</p>
</Panel>;
```

- `React.ReactNode` is the right type for "renders as-is" children — it covers elements, strings, numbers, fragments, `null`, and arrays of these.
- Use a narrower type (e.g. `React.ReactElement`) only when you need to enforce that children are a specific element type, such as validating a compound-component API.

## Passing Through Native Element Props

To let a component accept every prop a native element supports (`id`, `aria-*`, event handlers, etc.), extend the corresponding JSX attributes type and spread the rest.

```tsx
type InputProps = React.ComponentProps<"input"> & {
  label: string;
};

function TextField({ label, ...inputProps }: InputProps) {
  return (
    <label>
      {label}
      <input {...inputProps} />
    </label>
  );
}
```

- `React.ComponentProps<"input">` (or `<typeof SomeComponent>` for a custom component) gives you the full, correct prop type without hand-maintaining it.
- Spread native props last-ish so callers can override things like `className`, but keep any props your component controls (e.g. a fixed `type="text"`) after the spread if they must not be overridden.

## `ref` as a Prop (React 19)

As of React 19, `ref` is a regular prop on function components — no `forwardRef` wrapper is needed for a component to accept a ref to one of its DOM nodes.

```tsx
type TextFieldProps = {
  label: string;
  ref?: React.Ref<HTMLInputElement>;
};

function TextField({ label, ref }: TextFieldProps) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
}

// Usage — no forwardRef anywhere
function Form() {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <form>
      <TextField label="Name" ref={inputRef} />
      <button type="button" onClick={() => inputRef.current?.focus()}>
        Focus
      </button>
    </form>
  );
}
```

- Just declare `ref` in the props type (typed as `React.Ref<T>`) and forward it to the DOM node/child that should receive it — that's the whole pattern.
- `forwardRef` still works (for gradual migration) but is legacy going forward; do not reach for it in new React 19 code.
- To expose an imperative API instead of a raw DOM node, use `useImperativeHandle(ref, () => ({ ... }))` inside the component — it composes directly with `ref`-as-prop, still no `forwardRef`:

```tsx
type VideoPlayerProps = {
  src: string;
  ref?: React.Ref<{ play: () => void; pause: () => void }>;
};

function VideoPlayer({ src, ref }: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
  }));

  return <video ref={videoRef} src={src} />;
}
```

- `ref` callbacks may now return a cleanup function (run on unmount/detach), mirroring `useEffect`. Don't implicitly return a non-function value from an inline ref callback — TypeScript will reject it.
- Class components still receive `ref` specially (an instance ref) and are unaffected by this change — it only applies to function components.

## Nuances & Gotchas

- Props are read-only: never write `props.value = x`. If a value must change, lift it to `useState` (owned by this component) or have the parent own it and pass a new value down.
- Avoid an ever-growing list of boolean props (`isPrimary`, `isLarge`, `isDisabled`, `isLoading`...) — it's a sign the component needs composition (children/slots) or a variant union instead.
- Don't spread unknown/arbitrary props onto a DOM element without narrowing the type first — it silently allows any prop through and defeats type checking.
- Object/array/function literals passed inline as props (`onClick={() => ...}`, `style={{ ... }}`) create a new reference every render; this only matters if the receiving component is wrapped in `memo` and relies on referential equality — the React Compiler handles most of this automatically, so don't hand-memoize preemptively.
