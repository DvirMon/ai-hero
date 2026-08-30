# Unit Testing — React Examples

> Principle and test/skip rules live in `unit-testing.md` (agnostic). This file is React Testing Library / Vitest syntax only.

## Setup Function

Every spec file should define a `setup()` factory. No raw `render()` in individual tests.

```tsx
function setup(overrides: Partial<ButtonProps> = {}) {
  const props: ButtonProps = { label: 'Click me', variant: 'primary', ...overrides };
  const user = userEvent.setup();
  const result = render(<Button {...props} />);
  return { ...result, user };
}

// each test only specifies what's different
it('renders disabled state', async () => {
  setup({ disabled: true });
  expect(screen.getByRole('button')).toBeDisabled();
});

it('calls onClick when clicked', async () => {
  const onClick = vi.fn();
  const { user } = setup({ onClick });
  await user.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalledOnce();
});
```

## Interaction: Always `userEvent` over `fireEvent`

`userEvent` simulates the full browser event chain (pointer, mouse, focus, click). `fireEvent` dispatches a single synthetic event and skips intermediate steps — masking bugs in focus management, validation timing, and event ordering.

```tsx
// GOOD
import userEvent from '@testing-library/user-event';
await userEvent.click(screen.getByRole('button'));

// BAD — skips pointerDown, mousedown, focus
import { fireEvent } from '@testing-library/react';
fireEvent.click(screen.getByRole('button'));
```

## Query Priority

Query the way a user or assistive technology would:

```tsx
// 1. Accessible role (preferred)
screen.getByRole('button', { name: /submit/i })

// 2. Label / visible text
screen.getByLabelText(/email address/i)
screen.getByText(/error: field required/i)

// 3. Test ID (escape hatch — only when semantics fail)
screen.getByTestId('color-swatch-canvas')
```

If `getByRole` can't find your element, fix the markup before reaching for `getByTestId`.

## Accessibility Auditing

Run `vitest-axe` (or `jest-axe`) on every component render to catch a11y violations automatically:

```tsx
import { axe } from 'vitest-axe';

it('has no a11y violations', async () => {
  const { container } = render(<{Prefix}<Name> variant="primary" />);
  expect(await axe(container)).toHaveNoViolations();
});
```

Include an axe check for each meaningfully different prop combination (e.g., error state, disabled state) — not just the default render.

## What to Test

### Computed state with conditions

```tsx
it('marks as non-interactive when disabled', () => {
  render(<{Prefix}<Name> disabled />);
  expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
});
```

### Callback invocations triggered by logic

```tsx
it('calls onDismiss when close is triggered and not disabled', async () => {
  const onDismiss = vi.fn();
  render(<{Prefix}<Name> onDismiss={onDismiss} />);
  await userEvent.click(screen.getByRole('button', { name: /close/i }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it('does not call onDismiss when disabled', async () => {
  const onDismiss = vi.fn();
  render(<{Prefix}<Name> disabled onDismiss={onDismiss} />);
  await userEvent.click(screen.getByRole('button', { name: /close/i }));
  expect(onDismiss).not.toHaveBeenCalled();
});
```

### Observer-based calculations (resize, intersection)

Test the extracted hook directly with `renderHook`, not the component:

```tsx
it('sets hasOverflow to true when content height exceeds container', () => {
  const { result } = renderHook(() => use{Prefix}Overflow());
  act(() => triggerResizeObserver({ contentHeight: 200, containerHeight: 100 }));
  expect(result.current.hasOverflow).toBe(true);
});
```

### State derived from multiple inputs

```tsx
it('uses danger variant when hasError is true and no explicit variant is set', () => {
  render(<{Prefix}<Name> hasError />);
  expect(screen.getByTestId('root')).toHaveClass('danger');
});

it('respects explicit variant even when hasError is true', () => {
  render(<{Prefix}<Name> hasError variant="warning" />);
  expect(screen.getByTestId('root')).toHaveClass('warning');
});
```

### Guard logic (state doesn't change on repeated calls)

```tsx
it('does not call onOpen twice when already open', async () => {
  const onOpen = vi.fn();
  render(<{Prefix}<Name> defaultOpen onOpen={onOpen} />);
  await userEvent.click(screen.getByRole('button', { name: /open/i }));
  expect(onOpen).not.toHaveBeenCalled();
});
```

## What NOT to Test

### CSS class presence for its own sake

```tsx
// BAD: tests the className binding, not logic
it('has class primary when variant is primary', () => {
  expect(screen.getByTestId('root')).toHaveClass('primary');
});
```

### Children/content projection

```tsx
// BAD: rendering children is React's responsibility
it('renders projected children', () => { ... });
```

### Static markup structure

```tsx
// BAD: not logic
it('renders an icon element', () => {
  expect(screen.getByTestId('icon')).toBeInTheDocument();
});
```

### Simple prop passthrough with no logic

```tsx
// BAD: not logic — just a binding, no conditions
it('passes the variant prop to the root', () => { ... });
```
