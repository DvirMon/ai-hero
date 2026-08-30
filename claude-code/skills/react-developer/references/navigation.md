# Navigation: `<Link>`, `useNavigate`

React Router offers two ways to move between routes: `<Link>` for declarative, user-triggered navigation rendered as part of the JSX tree, and `useNavigate` for imperative navigation triggered from code (after a mutation succeeds, from a keyboard shortcut, from a timer). Both are imported from `react-router`.

## `<Link>`: declarative navigation

Use `<Link>` for anything the user clicks to go somewhere — nav bars, list items, buttons that are fundamentally "go to this page." It renders a real `<a>` tag, so it gets keyboard navigation, middle-click-to-open-in-new-tab, and screen reader semantics for free — a `useNavigate` call on a `<div onClick>` does not.

```tsx
import { Link } from 'react-router';

function TeamList({ teams }: { teams: Team[] }) {
  return (
    <ul>
      {teams.map((team) => (
        <li key={team.id}>
          <Link to={`/teams/${team.id}`}>{team.name}</Link>
        </li>
      ))}
    </ul>
  );
}
```

- `to` accepts a plain path string, or an object `{ pathname, search, hash }` for building URLs from parts.
- `<Link to="/teams/1" state={{ from: 'list' }}>` attaches arbitrary state to the resulting location, readable via `useLocation().state` on the destination page (e.g. to show "back to list" context) — it does not appear in the URL.
- `<Link replace>` swaps the current history entry instead of pushing a new one, useful for links that shouldn't add a back-button stop (e.g. after a redirect-like action).
- `NavLink` (also from `react-router`) is the same idea but adds an `isActive`/`isPending` render callback for styling the current route in a nav bar.

## `useNavigate`: imperative navigation

Use `useNavigate` when navigation is a *consequence* of something happening in code, not a direct link the user clicks.

```tsx
import { useNavigate } from 'react-router';

function DeleteTeamButton({ teamId }: { teamId: string }) {
  const navigate = useNavigate();

  const handleDelete = async () => {
    await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
    // Navigate only after the mutation resolves.
    navigate('/teams', { replace: true });
  };

  return <button onClick={handleDelete}>Delete team</button>;
}
```

```tsx
const navigate = useNavigate();

navigate('/teams/1');                       // push a new entry
navigate('/teams/1', { replace: true });     // replace current entry
navigate('/teams/1', { state: { from: 'search' } });
navigate(-1);                                // go back, like history.back()
navigate(1);                                 // go forward
```

- The returned function accepts either a path (with an options object for `replace`/`state`) or a numeric delta to move through browser history.
- Common triggers: after a successful delete/submit, on session expiry (redirect to `/login`), after a timed step in a multi-step wizard.

## Which one to use

- Rendering something the user clicks to go to a specific page → `<Link>` (or `NavLink` if it needs an active-state style).
- Navigating as a side effect of an event handler, an `async` function completing, or a non-click trigger (timeout, keyboard shortcut, effect) → `useNavigate`.
- Redirecting as the direct result of a route's `loader`/`action` (e.g. "not logged in" or "created successfully") → prefer returning `redirect()` from the loader/action itself over calling `useNavigate` from inside a component that just rendered because of it — see `react-router.md` and `route-guards.md`.
