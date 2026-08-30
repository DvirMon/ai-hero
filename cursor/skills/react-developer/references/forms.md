# Form Actions

React 19 introduces Actions: functions passed to `<form action={...}>` that React calls automatically on submit, along with hooks to track their pending/result state. In a client-side SPA (no RSC, no framework server), the "action" is just a plain async function you write — there is no `'use server'` directive here, that flavor only applies to React Server Components frameworks like Next.js.

## Wiring a form to an async action

Pass a function to `<form action={fn}>` instead of an `onSubmit` handler. React calls it with the submitted `FormData` and automatically resets the uncontrolled form fields on success.

```tsx
async function subscribe(formData: FormData) {
  const email = formData.get('email') as string;

  const res = await fetch('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Subscription failed');
  }
}

function NewsletterForm() {
  return (
    <form action={subscribe}>
      <input type="email" name="email" required />
      <button type="submit">Subscribe</button>
    </form>
  );
}
```

- The action function is plain client-side async code — call `fetch`, a query client mutation, whatever your app uses. Nothing runs on a server.
- This bare form is fine for simple, single-field, "fire and forget" submissions. For anything with pending UI, error display, or a result to show, reach for `useActionState` below.

## `useActionState`: pending, error, and result state

`useActionState` wraps an action function and gives you back its latest state, a wrapped dispatch function to pass to `<form action={...}>`, and a pending flag — all managed by React.

```tsx
import { useActionState } from 'react';

type SubscribeState = { status: 'idle' | 'success' | 'error'; error?: string };

async function subscribeAction(
  previousState: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const email = formData.get('email') as string;

  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Subscription failed');
    return { status: 'success' };
  } catch (err) {
    return { status: 'error', error: (err as Error).message };
  }
}

function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(subscribeAction, {
    status: 'idle',
  });

  return (
    <form action={formAction}>
      <input type="email" name="email" required disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Submitting…' : 'Subscribe'}
      </button>
      {state.status === 'error' && <p role="alert">{state.error}</p>}
      {state.status === 'success' && <p>Thanks — you're subscribed.</p>}
    </form>
  );
}
```

- `useActionState(actionFn, initialState, permalink?)` returns `[state, dispatch, isPending]`.
- The action receives `(previousState, formData)` — the first argument is whatever it last returned (or `initialState` before the first submit).
- `isPending` is tracked automatically; error/success/result data is **not** — return it as part of the state object yourself.
- The third `permalink` argument is only relevant for progressive enhancement in server-rendered apps; skip it in a client SPA.
- Pass `formAction` (not the raw `subscribeAction`) to `<form action={...}>` — that's the wrapped dispatcher React needs to track state.

## Optimistic updates with `useOptimistic`

For instant feedback before the action resolves (e.g. adding an item to a list), pair the action with `useOptimistic`.

```tsx
import { useOptimistic, useActionState } from 'react';

function TodoList({ todos, addTodo }: { todos: Todo[]; addTodo: (formData: FormData) => Promise<Todo[]> }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTitle: string) => [...state, { id: 'temp', title: newTitle, pending: true }],
  );

  const [, formAction] = useActionState(async (_prev: Todo[], formData: FormData) => {
    const title = formData.get('title') as string;
    addOptimisticTodo(title);
    return addTodo(formData);
  }, todos);

  return (
    <form action={formAction}>
      <input name="title" />
      <button type="submit">Add</button>
      <ul>
        {optimisticTodos.map((t) => (
          <li key={t.id} style={{ opacity: t.pending ? 0.5 : 1 }}>
            {t.title}
          </li>
        ))}
      </ul>
    </form>
  );
}
```

- `useOptimistic(state, updateFn)` returns the optimistic value and a setter; React automatically reverts to the real `state` once the surrounding action finishes (success or failure).
- Call the optimistic setter synchronously, before the `await`, inside the action.

## `useFormStatus`: reading pending state from a child

`useFormStatus` lets a nested component (e.g. a reusable `SubmitButton`) read the enclosing `<form>`'s pending state without prop drilling. It must be called from a component rendered **inside** the `<form>` — not the component that renders the `<form>` tag itself — and is imported from `react-dom`.

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </button>
  );
}

function ProfileForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action}>
      <input name="name" />
      {/* SubmitButton is a child of <form>, so useFormStatus works here */}
      <SubmitButton />
    </form>
  );
}
```

- Returns `{ pending, data, method, action }` for the parent form's *in-flight* submission; all fields are default/empty when no submission is active.
- Reuse one `SubmitButton` across every form in the app instead of threading an `isPending` prop through each one.
- Because it reads context from the nearest parent `<form>`, `useFormStatus` called at the top level of the component that renders the `<form>` will always see `pending: false` — that component isn't "inside" its own form.
