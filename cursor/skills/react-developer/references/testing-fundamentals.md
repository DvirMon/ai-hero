# Fundamentals: Vitest + React Testing Library

> **Scope:** this file and [component-testing.md](component-testing.md) cover *how* to set up
> and express React tests. They do **not** decide *what* is worth testing — that policy lives
> in the **`unit-test`** skill (`unit-testing.md` + `unit-testing.react.md`). Load that skill
> before choosing which tests to write, and this file for the mechanics.

Vitest is the test runner for this skill — it shares Vite's config, transform pipeline, and plugins, so there's no separate Babel/webpack setup to maintain. React Testing Library (RTL) is the component-testing layer on top of it.

## Installing the Stack

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## Vite/Vitest Configuration

Vitest reads its config from the same `vite.config.ts` (or a dedicated `vitest.config.ts`) via a `test` block — no separate config file is required.

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

- `environment: 'jsdom'` gives components a DOM to render into; without it, `document` and `window` don't exist.
- `globals: true` makes `describe`/`it`/`expect` available without importing them in every file — matches the Jest-style ergonomics most React devs expect.

## Setup File

Extend `expect` with jest-dom's DOM matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.) once, globally.

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

## React Testing Library's Philosophy

RTL is built around one guiding principle: **test your software the way users use it.** That means:

- Query the DOM the way a user or assistive technology would — by role, label, and visible text — not by CSS class or component internals.
- Never assert on component state, prop values, or instance methods directly. If a behavior can't be observed through the rendered output, the test is testing the wrong thing.
- Avoid shallow rendering. RTL always renders the full component tree so tests reflect what actually reaches the browser.

## A Basic Component Test

```tsx
// Counter.tsx
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}
```

```tsx
// Counter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments the displayed count when clicked', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });
});
```

## Assertions with jest-dom

jest-dom matchers read as intent rather than DOM plumbing — prefer them over manual attribute checks.

```tsx
expect(screen.getByRole('alert')).toBeVisible();
expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
expect(screen.getByLabelText(/email/i)).toHaveValue('a@b.com');
```

## Running Tests

```bash
npx vitest        # watch mode
npx vitest run     # single run, e.g. in CI
```

## Gotchas

- Don't render with `ReactDOM.render` directly — always go through RTL's `render`, which wraps in `act()` and gives you `screen` bound to the right container.
- User interactions (`user.click`, `user.type`) are asynchronous — always `await` them, even though the underlying `onClick` handler itself is sync.
- See [component-testing.md](component-testing.md) for query priority, `user-event` details, and testing custom hooks.
