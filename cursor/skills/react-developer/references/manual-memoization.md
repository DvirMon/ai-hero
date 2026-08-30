# Manual Memoization

With the React Compiler enabled, `useMemo`, `useCallback`, and `React.memo` are no longer the default tool for render performance — the compiler handles that. Reach for them manually only when something *outside* React's render model needs a stable reference, and the compiler has no way to see or guarantee that.

## When You Still Need It

### 1. External Library Requires Referential Stability

Some libraries compare a value by identity (`===`) across renders to decide whether to re-subscribe, re-run an effect, or re-initialize internal state — the compiler optimizes *your* component's re-renders, not a third-party library's internal equality checks.

```tsx
import {useMemo} from 'react';
import {useMapLibreInstance} from 'some-map-library';

function MapView({markers}: {markers: Marker[]}) {
  // The map library keeps this array reference and only re-renders markers
  // when the array identity changes — so we must guarantee that ourselves.
  const stableOptions = useMemo(
    () => ({markers, clusterRadius: 40}),
    [markers],
  );

  useMapLibreInstance(stableOptions);
  return <div id="map" />;
}
```

### 2. A Value Feeds an Effect Dependency Array in a Way the Compiler Can't See

The compiler memoizes what it can statically trace through component/Hook bodies. Once a value crosses into an opaque boundary — passed into a ref, stored in a module-level cache, handed to an imperative API — the compiler can no longer prove whether recomputing it is safe to skip, so it won't memoize on your behalf.

```tsx
import {useCallback, useEffect, useRef} from 'react';

function ChatRoom({roomId, onMessage}: {roomId: string; onMessage: (m: Msg) => void}) {
  // onMessage is passed into an external, non-React subscription API.
  // Its identity must be stable or the socket resubscribes every render.
  const stableOnMessage = useCallback(onMessage, [onMessage]);

  useEffect(() => {
    const socket = connectToRoom(roomId);
    socket.on('message', stableOnMessage);
    return () => socket.disconnect();
  }, [roomId, stableOnMessage]);

  return null;
}
```

## What Doesn't Need It Anymore

Do **not** reach for manual memoization just to:

- Avoid re-rendering a child component — the compiler already skips re-renders when props are unchanged.
- Avoid recomputing a derived value inside a component/Hook — the compiler caches it.
- Give an inline JSX callback a "stable" identity for its own sake — the compiler already does this.

```tsx
// Unnecessary with the compiler present — plain code is enough
function ProductCard({product, onAdd}: Props) {
  const formattedPrice = formatPrice(product.price); // compiler caches this
  return <button onClick={() => onAdd(product.id)}>{formattedPrice}</button>;
}
```

Adding `useMemo`/`useCallback` here doesn't break anything, but it's dead weight: extra code with no behavioral or performance benefit, and one more thing to keep in sync if the dependency list changes.

## Checklist Before Adding Manual Memoization

- Is the consumer of this value **outside** React's render model (a DOM API, a third-party library, a WebSocket handler, a module-level cache key)? If yes, manual memoization may be warranted.
- Is the consumer a React child component or a value only ever read inside another component/Hook body? If yes, the compiler already covers it — don't add `useMemo`/`useCallback`/`memo`.
- If you're unsure whether the compiler is already handling it, check the React DevTools "Memo ✨" badge on the component rather than guessing (see `react-compiler.md`).
