# Component Class — React Examples

> Conventions and rules live in `component-class.md` (agnostic). This file is React syntax only.

> Replace `{Prefix}` with your component prefix (e.g., `Atera`, `My`, `App`). Replace `<Name>` with the component name (e.g., `Card`, `Stepper`).

## Required Structure

```tsx
export type <Name>Variant = 'primary' | 'secondary';
export type <Name>Size = 'sm' | 'md' | 'lg';

interface {Prefix}<Name>Props {
  variant?: <Name>Variant;
  size?: <Name>Size;
  disabled?: boolean;
  onSomeEvent?: () => void;
}

export const {Prefix}<Name> = forwardRef<HTMLDivElement, {Prefix}<Name>Props>(
  ({ variant = 'primary', size = 'md', disabled = false, onSomeEvent, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          '{prefix}-<name>',
          '{prefix}-theme-element',
          variant === 'primary' && 'primary',
          variant === 'secondary' && 'secondary',
          disabled && 'disabled'
        )}
        aria-disabled={disabled}
        {...rest}
      />
    );
  }
);
```

## React-Specific Notes

### Theme element class in `className`

```tsx
className={clsx('{prefix}-<name>', '{prefix}-theme-element', ...)}
```

### Variant classes computed once, applied to the root element

```tsx
// GOOD: computed and applied to the root node
<div className={clsx('primary', variant === 'primary')} />
```

```tsx
// BAD: conditional class pushed onto a nested wrapper
<div><span className={variant === 'primary' ? 'primary' : ''}>...</span></div>
```

This keeps the root as the single styling anchor — no wrapper divs needed.

### Types exported alongside the component

Define all public types in the component's own file, then re-export them from the package's public entry point (`index.ts`). Never define types only at the barrel layer.

### `forwardRef` + `memo` for leaf components

DS components that don't need internal state should be wrapped in `memo`; components exposing a DOM ref to consumers must use `forwardRef`. No exceptions for components that render a single root element.

### No class components

All DS components are function components using hooks. Never author a new class component.
