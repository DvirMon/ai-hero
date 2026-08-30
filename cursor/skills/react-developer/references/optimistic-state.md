# Optimistic State

`useOptimistic` shows an expected result immediately, before an async Action (a form Action or any async mutation) actually confirms it with the server. Once the Action settles, the optimistic value reverts to whatever the real state ends up being.

## Basic Usage

```tsx
const [optimisticState, setOptimistic] = useOptimistic(state, reducer?);
```

- `state` — the value rendered when no Action is pending.
- `reducer` (optional) — `(currentState, action) => nextState`, for deriving the optimistic value from an action payload instead of setting it directly.
- Returns `[optimisticState, setOptimistic]`. `optimisticState` equals `state` until an Action calls the setter, at which point it reflects the optimistic value for the duration of that Action.

## Pairing with a Form Action

```tsx
import {useOptimistic} from 'react';
import {updateName} from './actions';

function EditName({name, onSaved}: {name: string; onSaved: (name: string) => void}) {
  const [optimisticName, setOptimisticName] = useOptimistic(name);

  async function submitAction(formData: FormData) {
    const newName = formData.get('name') as string;
    setOptimisticName(newName); // no startTransition needed — Action props already run inside one

    const saved = await updateName(newName);
    onSaved(saved);
  }

  return (
    <form action={submitAction}>
      <p>Your name is: {optimisticName}</p>
      <input type="text" name="name" disabled={name !== optimisticName} />
    </form>
  );
}
```

- Inside a `<form action={...}>` Action (or any function passed as an Action prop), the Action body already runs inside a Transition, so calling the optimistic setter directly is fine.
- Outside an Action prop — e.g. a plain `onClick` handler — you must wrap the call in `startTransition` yourself, or React warns: *"An optimistic state update occurred outside a Transition or Action."*

```tsx
function handleClick() {
  startTransition(async () => {
    setOptimisticLiked(true);
    await likeAction();
  });
}
```

## Reverting on Failure

There's no separate "rollback" call — reverting is automatic. If the Action throws, the Transition ends and React re-renders with the last confirmed `state`, which the optimistic value tracks back down to:

```tsx
function DeleteButton({id, onDeleted}: {id: string; onDeleted: (id: string) => void}) {
  const [isDeleting, setOptimisticDeleting] = useOptimistic(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      setOptimisticDeleting(true);
      try {
        await deleteAction(id);
        onDeleted(id); // real state update on success
      } catch (e) {
        setError((e as Error).message); // optimistic state reverts automatically
      }
    });
  }

  return (
    <>
      <button onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? 'Deleting…' : 'Delete'}
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
```

- Only update the *real* state (`onDeleted`, `setValue`, etc.) on success. Because the optimistic value is derived from real state, a caught error that skips the real update means the UI snaps back to the pre-optimistic value on its own.
- Catch the error to surface a message — the revert itself needs no extra code.

## Multiple Related Fields (Reducer Form)

Use the reducer overload when one action should update several derived values together, so they can't drift out of sync mid-flight:

```tsx
const [optimisticState, updateOptimistic] = useOptimistic(
  {isFollowing: user.isFollowing, followerCount: user.followerCount},
  (current, isFollowing: boolean) => ({
    isFollowing,
    followerCount: current.followerCount + (isFollowing ? 1 : -1),
  }),
);

function handleClick() {
  const next = !optimisticState.isFollowing;
  startTransition(async () => {
    updateOptimistic(next);
    await followAction(next);
  });
}
```

## Caveats

- The optimistic setter can only be called during a Transition or Action — never during render, and never in a plain unwrapped event handler.
- Optimistic state is inherently temporary: as soon as the enclosing Action finishes and real state settles, the optimistic value converges back to derived-from-`state`, whatever that ends up being.
- Keep the reducer/derivation pure — it may run more than once per action.
