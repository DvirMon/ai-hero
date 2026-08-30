# Suspense Boundaries

`<Suspense>` shows a fallback while any descendant is waiting on data (via `use(promise)`, a Suspense-enabled data library, or `React.lazy`). Where you place boundaries controls the granularity of loading states and whether requests fire in parallel or one after another.

## Placement

Wrap the smallest unit of UI that should show its own loading state — not the whole page, and not every leaf.

```tsx
import {Suspense} from 'react';

function ProfilePage() {
  return (
    <>
      <ProfileHeader /> {/* renders immediately, no data dependency */}
      <Suspense fallback={<PostsSkeleton />}>
        <ProfilePosts /> {/* suspends independently while its data loads */}
      </Suspense>
      <Suspense fallback={<FriendsSkeleton />}>
        <ProfileFriends /> {/* suspends independently while its data loads */}
      </Suspense>
    </>
  );
}
```

- One boundary around the whole page → the entire page waits for the *slowest* piece of data, even though the header had nothing to wait for.
- A boundary per independent section → each section reveals as soon as its own data is ready; sections don't block each other.
- A boundary per tiny leaf → too many independent flickers/skeletons; group related content behind one boundary instead.

## Avoiding Request Waterfalls

A waterfall happens when a child only *starts* fetching after its parent has already rendered — i.e. the fetch is triggered from inside the component that suspends on it, so the request for child B can't begin until parent A's render (and its own fetch) has resolved.

```tsx
// ❌ Waterfall: Post's fetch doesn't start until Page has already
// resolved its own data and rendered far enough to reach <Post>.
function Page({id}: {id: string}) {
  const page = use(fetchPage(id));
  return (
    <Suspense fallback={<Spinner />}>
      <Post postId={page.postId} /> {/* fetchPost() only called once Post renders */}
    </Suspense>
  );
}

function Post({postId}: {postId: string}) {
  const post = use(fetchPost(postId));
  return <article>{post.title}</article>;
}
```

```tsx
// ✅ Parallel: both requests are kicked off together, before either
// component reads its result with use().
function Page({id}: {id: string}) {
  const pagePromise = fetchPage(id);       // started immediately
  const postPromise = fetchPost(id);       // started immediately, not nested

  return (
    <Suspense fallback={<Spinner />}>
      <PageBody pagePromise={pagePromise} postPromise={postPromise} />
    </Suspense>
  );
}

function PageBody({pagePromise, postPromise}: Props) {
  const page = use(pagePromise);
  const post = use(postPromise);
  return (
    <>
      <h1>{page.title}</h1>
      <article>{post.title}</article>
    </>
  );
}
```

- Kick off every fetch you'll need **before** any `use()` call blocks on one of them — start all Promises up front (e.g. at the top of a route/loader or a shared parent), then pass them down and unwrap with `use()` where each is needed.
- If two pieces of data are independent, don't `await` one before starting the other's fetch — start both, then `use()`/`await` each where it's consumed.
- Nesting `<Suspense>` boundaries is fine for independent *rendering* granularity; just make sure nested boundaries don't accidentally imply nested (sequential) *fetching*.

## Pairing with Error Boundaries

`<Suspense>` only handles the pending state. A rejected Promise (or a thrown render error) propagates to the nearest **error boundary**, not the Suspense fallback — always put one above any boundary that can fail.

```tsx
import {Suspense} from 'react';
import {ErrorBoundary} from 'react-error-boundary';

function AlbumsSection({albumsPromise}: {albumsPromise: Promise<Album[]>}) {
  return (
    <ErrorBoundary fallback={<p>Could not load albums.</p>}>
      <Suspense fallback={<p>Loading albums…</p>}>
        <Albums albumsPromise={albumsPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}

function Albums({albumsPromise}: {albumsPromise: Promise<Album[]>}) {
  const albums = use(albumsPromise); // rejection is caught by the ErrorBoundary above
  return (
    <ul>
      {albums.map((a) => (
        <li key={a.id}>{a.title}</li>
      ))}
    </ul>
  );
}
```

- Order matters: `<ErrorBoundary>` outside, `<Suspense>` inside. If they were swapped, the error boundary couldn't catch errors thrown while the Suspense fallback is showing.
- Give the error boundary a `resetKeys`/retry mechanism (e.g. re-run the fetch and reset on a new Promise) so users aren't stuck on a permanent error fallback.
- Don't use `try`/`catch` around `use(promise)` to handle rejection — it doesn't work; the error boundary is the mechanism.

## Nuances

- A boundary's fallback shows on the *first* suspend; subsequent re-suspends of already-revealed content instead keep old content visible when the update is wrapped in a Transition (see `transitions.md`) or read via `useDeferredValue` — avoiding fallback flicker on refetch.
- Colocate a boundary with the data it's waiting on: if `ProfilePosts` and `ProfileFriends` fetch independently, don't share one boundary unless you're fine with them revealing together.
- Suspense composes with `React.lazy` the same way — code-split chunks and data reads can share a boundary if you want one loading state for "this section isn't ready yet" regardless of why.
