# React Router: Routes, Nested Routes, Loaders, `<Outlet>`

React Router v7's **data mode** is the current recommended way to wire routing into a client SPA: routes are configured as a data structure (not just JSX), each route can declare a `loader`/`action` that runs before/around rendering, and layouts nest via `<Outlet>`. In a plain Vite SPA (not using the React Router framework/Vite plugin), everything is imported from the single `react-router` package — there is no separate `react-router-dom` needed for v7.

## Configuring routes

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router';
import { RootLayout } from './root-layout';
import { HomePage } from './home-page';
import { TeamPage, teamLoader } from './team-page';

const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      {
        path: 'teams/:teamId',
        Component: TeamPage,
        loader: teamLoader,
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

- `createBrowserRouter` takes an array of route objects; `RouterProvider` renders the matched tree.
- `Component` takes the component reference directly (no need to write `element: <TeamPage />>`), so route modules stay easy to code-split.
- `index: true` marks the child that renders at the parent's own path (`/` here), instead of giving it its own `path`.
- Dynamic segments use a leading colon (`:teamId`); read them via `useParams()` or the `params` argument in a loader/action.

## Nested routes and `<Outlet>`

A parent route's `Component` renders its own layout chrome and an `<Outlet>` where the matched child route renders.

```tsx
import { Outlet, NavLink } from 'react-router';

export function RootLayout() {
  return (
    <div>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/teams/red">Red Team</NavLink>
      </nav>
      {/* The matched child route (HomePage, TeamPage, ...) renders here */}
      <Outlet />
    </div>
  );
}
```

- Nesting is unlimited — a child route can itself have `children` with its own `<Outlet>`, building up a layout tree (app shell → section layout → page).
- `<Outlet context={value} />` can pass data down to nested routes that read it via `useOutletContext()`.

## Loaders: fetching data before render

A `loader` runs before its route's component renders, so the component can read data synchronously via `useLoaderData()` — no loading spinner state to hand-manage inside the component.

```tsx
import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';

export async function teamLoader({ params }: LoaderFunctionArgs) {
  const res = await fetch(`/api/teams/${params.teamId}`);
  if (!res.ok) {
    throw new Response('Team not found', { status: 404 });
  }
  return res.json();
}

export function TeamPage() {
  const team = useLoaderData() as { name: string; members: string[] };
  return <h1>{team.name}</h1>;
}
```

- The loader receives `{ params, request }` — `params` for route params, `request` for reading the URL/search params or headers.
- Throwing a `Response` (or calling `throw data(payload, { status })`) from a loader routes to the nearest `ErrorBoundary` instead of rendering the page — the standard way to model "not found" or "forbidden".
- Loaders run in parallel for every route matched in a given navigation, including nested ones.

## Actions: mutations tied to a route

An `action` is a loader's write-side counterpart: it runs when a `<Form method="post">` (React Router's own `Form`, not the plain DOM one) or a submission helper targets that route, and its result is read via `useActionData()`.

```tsx
import { Form, useActionData, redirect } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';

export async function createTeamAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get('name') as string;

  if (!name) {
    return { error: 'Name is required' };
  }

  const team = await createTeam({ name });
  return redirect(`/teams/${team.id}`);
}

export function NewTeamPage() {
  const actionData = useActionData() as { error?: string } | undefined;

  return (
    <Form method="post">
      <input name="name" />
      {actionData?.error && <p role="alert">{actionData.error}</p>}
      <button type="submit">Create team</button>
    </Form>
  );
}
```

- `redirect(url)` from an action or loader performs a router-level navigation — prefer it over `useNavigate` when redirecting as a direct result of a data operation.
- Router's `<Form>` behaves like a native `<form>` but submits via client-side navigation into the matching route's `action`, so `useActionData()` reflects the result without a full page reload.

## Per-route error handling

Each route can declare an `ErrorBoundary` component to catch errors thrown by its own `loader`/`action`/render, or by a child route that doesn't have its own boundary.

```tsx
import { useRouteError, isRouteErrorResponse } from 'react-router';

export function TeamErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <p>{error.status === 404 ? 'Team not found.' : 'Something went wrong.'}</p>;
  }
  return <p>Unexpected error: {(error as Error).message}</p>;
}
```

- Attach it as `ErrorBoundary: TeamErrorBoundary` alongside `Component` and `loader` on the route object.
- `isRouteErrorResponse` narrows thrown `Response`/`data()` errors so you can branch on `status`; anything else is a regular JS error.
- Errors bubble to the closest ancestor route that declares an `ErrorBoundary`, so a root-level boundary is a reasonable catch-all fallback.
