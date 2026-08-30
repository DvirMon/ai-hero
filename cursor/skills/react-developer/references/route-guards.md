# Route Guards: Protected Routes and Auth Boundaries

There's no built-in "guard" concept in React Router — protecting a route client-side means either (a) wrapping protected routes in a component that checks auth state and renders `<Navigate>` when it fails, or (b) redirecting from a route's `loader` before the component ever renders. Prefer the loader approach when auth state is available synchronously or via an awaitable check; use the wrapper-component approach when auth state comes from client-side context/state that route loaders can't easily reach.

## Wrapper component with `<Navigate>`

A `<ProtectedRoute>` component sits as the `Component` for a layout route; it renders `<Outlet>` (letting the real page render) when authorized, or `<Navigate>` to redirect when not.

```tsx
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './auth-context';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!user) {
    // Remember where the user was headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
```

Wire it as a parent route with no path, so every child inherits the guard:

```tsx
const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    Component: ProtectedRoute,
    children: [
      { path: '/dashboard', Component: Dashboard },
      { path: '/settings', Component: Settings },
    ],
  },
]);
```

- `replace` avoids leaving the protected URL in browser history — hitting "back" from `/login` won't bounce the user right back to the page that just rejected them.
- Passing `state={{ from: location }}` lets the login page read `useLocation().state?.from` and `navigate(from, { replace: true })` after a successful sign-in, returning the user to where they were headed.
- Because `ProtectedRoute` has no `path`, it's a pure layout route — it groups children under one auth check without adding a URL segment.

## Redirecting from a `loader`

When the auth check can run outside a component (e.g. reading a token from storage, or an already-resolved auth store), redirecting from the route's `loader` skips rendering the protected page entirely — no flash of protected content before the check completes.

```tsx
import { redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { getCurrentUser } from './auth';

export async function requireAuth({ request }: LoaderFunctionArgs) {
  const user = await getCurrentUser();
  if (!user) {
    const redirectTo = new URL(request.url).pathname;
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
  return user;
}

const router = createBrowserRouter([
  {
    path: '/dashboard',
    Component: Dashboard,
    loader: requireAuth,
  },
]);
```

- `throw redirect(url)` (not `return`) immediately stops the render for this route and navigates the browser — the component's code never runs.
- Reading `redirectTo` off the query string on the login page lets it send the user back to their original destination after signing in, mirroring the `state.from` pattern above.
- A shared `requireAuth` loader can be composed into any route that needs protection; call it at the top of a route's own `loader` if that route also needs to fetch data (`await requireAuth(args)` then continue).

## Choosing between the two

- **Component wrapper (`<Navigate>`)** — auth state lives in React context/state (e.g. a `useAuth()` hook backed by a client-side store), or the check needs to show a loading state while auth initializes.
- **Loader redirect** — auth state is available as an awaitable check independent of component render (token in storage, a resolved singleton auth client); avoids any flash of the protected route's UI.
- Both can coexist: a top-level `<ProtectedRoute>` wrapper for the general case, plus per-route loader checks for stricter, data-dependent authorization (e.g. "only the team owner can edit this team").
