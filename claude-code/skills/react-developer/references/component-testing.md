# Component Testing: Queries, `user-event`, Testing Custom Hooks

Builds on [testing-fundamentals.md](testing-fundamentals.md). This file covers *how* to query the rendered DOM, how to simulate realistic user input, and how to test hooks that don't render any UI themselves.

> **Scope:** mechanics only. For *what deserves a test* — the contract model, the
> what-to-test / what-NOT-to-test lists, mocking boundaries — load the **`unit-test`** skill.

## Query Priority

RTL's queries are ranked by how closely they match how a real user (including one on assistive technology) finds an element. Reach for the highest-priority query that works before falling back to a lower one.

1. **`getByRole`** — matches the accessibility tree (button, link, heading, textbox…). Almost always the right first choice.
2. **`getByLabelText`** — for form fields associated with a `<label>`.
3. **`getByPlaceholderText`** — weaker signal than a label; use only if no label exists.
4. **`getByText`** — for non-interactive content (paragraphs, headings without a role query).
5. **`getByDisplayValue`** — matches the current value of a form element.
6. **`getByAltText`** — for `<img>`, `<area>`, or `<input type="image">`.
7. **`getByTitle`** — the `title` attribute is rarely read by assistive tech; low signal.
8. **`getByTestId`** — last resort, for elements with no accessible role, text, or label (e.g. a purely decorative wrapper `div`).

```tsx
// Preferred
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email address/i);

// Last resort — only when nothing above applies
screen.getByTestId('decorative-gradient-overlay');
```

- If reaching for `getByTestId`, treat it as a signal the markup may be missing semantics — consider whether an ARIA role or label should be added instead.
- `getBy*` throws if the element isn't found (use for asserting presence); `queryBy*` returns `null` (use for asserting *absence*); `findBy*` returns a promise (use for elements that appear asynchronously).

```tsx
expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
expect(await screen.findByText(/loaded/i)).toBeInTheDocument();
```

## `user-event` vs `fireEvent`

`fireEvent` dispatches a single synthetic DOM event. `user-event` simulates the full sequence of events a browser fires for a real interaction — e.g. a click also fires `pointerdown`, `mousedown`, `focus`, `pointerup`, `mouseup`, then `click`. Default to `user-event`; only reach for `fireEvent` when you need to trigger a low-level event `user-event` doesn't model.

```tsx
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

await user.click(screen.getByRole('checkbox'));
await user.type(screen.getByLabelText(/name/i), 'Ada Lovelace');
await user.selectOptions(screen.getByRole('combobox'), 'medium');
await user.tab();
```

- Always call `userEvent.setup()` once per test before rendering — it configures the shared event pipeline for that test's interactions.
- Every `user-event` call is async and advances a simulated clock between key presses, so `type()` produces one `change` event per keystroke, matching real typing.

## Testing a Form Interaction

```tsx
// LoginForm.tsx
export function LoginForm({ onSubmit }: { onSubmit: (email: string) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get('email') as string;
        onSubmit(email);
      }}
    >
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" />
      <button type="submit">Log in</button>
    </form>
  );
}
```

```tsx
// LoginForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

it('submits the entered email', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();
  render(<LoginForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
  await user.click(screen.getByRole('button', { name: /log in/i }));

  expect(handleSubmit).toHaveBeenCalledWith('ada@example.com');
});
```

## Testing Custom Hooks with `renderHook`

When a hook has no meaningful UI of its own, test it directly with `renderHook` instead of mounting a throwaway component. `renderHook` is exported from `@testing-library/react` — no separate package needed.

```tsx
// useCounter.ts
import { useCallback, useState } from 'react';

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  return { count, increment };
}
```

```tsx
// useCounter.test.ts
import { act, renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useCounter } from './useCounter';

it('increments the count', () => {
  const { result } = renderHook(() => useCounter(5));

  expect(result.current.count).toBe(5);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(6);
});
```

- Wrap any state-updating call in `act()` so React flushes effects and re-renders before your next assertion — `renderHook`'s own render is already wrapped, but calls you trigger afterward are not.
- `result.current` always reflects the latest render; re-read it after each `act()` rather than destructuring once at the top.

## Async Hooks and `waitFor`

For hooks that update state asynchronously (e.g. after a fetch), assert with `waitFor` rather than an arbitrary delay.

```tsx
import { renderHook, waitFor } from '@testing-library/react';

it('resolves the fetched value', async () => {
  const { result } = renderHook(() => useUser(1));

  await waitFor(() => expect(result.current.status).toBe('success'));
  expect(result.current.data?.name).toBe('Ada');
});
```

## Gotchas

- Don't query by CSS class or DOM structure (`container.querySelector('.btn')`) — it couples the test to implementation details RTL is designed to avoid.
- Passing a hook that needs context (e.g. a router or provider) requires `renderHook`'s `wrapper` option — don't skip providers just because there's no visible UI.
- Prefer `findBy*` over manually `await`-ing a `setTimeout` when waiting on async UI updates.
