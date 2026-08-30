# Feature-Sliced Design

Feature-Sliced Design (FSD) organizes a Vite SPA by *what the code is for* (a feature, a page, a shared primitive) rather than by *what kind of file it is* (`components/`, `hooks/`, `utils/`). This keeps features independently understandable and prevents the "everything imports everything" tangle that grows in flat `src/` layouts.

## Layers

FSD defines a fixed set of layers, ordered from most to least specific:

| Layer | Purpose |
|---|---|
| `app` | App-wide setup: providers, router, global styles, entry point. |
| `pages` | Route-level compositions — assembles widgets/features into a screen. |
| `widgets` | Large, self-contained UI blocks composed from features/entities (e.g. a page header, a dashboard sidebar). |
| `features` | A single user-facing capability with behavior (e.g. `add-to-cart`, `toggle-favorite`). |
| `entities` | Business data models and their basic display (e.g. `user`, `product` — a card, an avatar). |
| `shared` | Reusable, business-agnostic code: UI kit, generic hooks, API client, utils. |

Not every project needs every layer — a small app may skip `widgets` entirely and have `pages` compose `features` directly. Don't create empty layers for the sake of completeness.

## The Dependency Direction Rule

**Higher layers may import from lower layers. Lower layers may never import from higher layers.**

```
app → pages → widgets → features → entities → shared
(higher)                                        (lower)
```

- A `feature` can import from `entities` and `shared`.
- A `feature` can **never** import from another `feature`, from `widgets`, `pages`, or `app`. Sideways imports between features are the most common violation — if `add-to-cart` needs something from `remove-from-cart`, that shared piece belongs in `entities` or `shared`, not imported feature-to-feature.
- `entities` can import from `shared` only — never from `features` and above.
- `shared` imports from nothing else in the app — it has no knowledge that features, pages, or the app even exist.

This rule is what keeps a feature deletable: removing a `features/` folder should never break something in `entities` or `shared`, because nothing below `features` ever depended on it.

## Slices and Segments

Within `pages`, `widgets`, `features`, and `entities`, code is split into **slices** (one folder per page/feature/entity — e.g. `features/add-to-cart`), and each slice is split into **segments** by technical purpose:

- `ui/` — components
- `model/` — state, hooks, business logic
- `api/` — requests specific to this slice
- `lib/` — slice-local helper functions

A slice exposes its public surface through a single `index.ts` barrel file. Other layers import *only* from that barrel, never by reaching into a slice's internal folders (`features/add-to-cart/model/useCart` — forbidden from outside; import `from 'features/add-to-cart'` instead).

## Folder Template (Vite SPA)

```
src/
  app/
    providers/          # QueryClientProvider, Router, ThemeProvider
    App.tsx
    main.tsx
  pages/
    product-page/
      ui/ProductPage.tsx
      index.ts
  widgets/
    site-header/
      ui/SiteHeader.tsx
      index.ts
  features/
    add-to-cart/
      ui/AddToCartButton.tsx
      model/useAddToCart.ts
      api/addToCart.ts
      index.ts
  entities/
    product/
      ui/ProductCard.tsx
      model/product.types.ts
      api/getProduct.ts
      index.ts
  shared/
    ui/             # Button, Input, Dialog — generic UI kit
    hooks/          # useDebounce, useMediaQuery
    api/            # base fetch client, TanStack Query config
    lib/            # formatCurrency, cn(), generic utils
```

```ts
// entities/product/index.ts — the slice's public API
export { ProductCard } from './ui/ProductCard';
export type { Product } from './model/product.types';
```

```ts
// features/add-to-cart/ui/AddToCartButton.tsx
import { Button } from 'shared/ui';           // shared: always allowed
import { Product } from 'entities/product';   // entities: allowed (lower layer)
import { useAddToCart } from '../model/useAddToCart'; // same slice: allowed

export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart, isPending } = useAddToCart();
  return (
    <Button onClick={() => addToCart(product.id)} disabled={isPending}>
      Add to cart
    </Button>
  );
}
```

- Enforce the dependency rule with lint rules (e.g. `eslint-plugin-boundaries` or `steiger`) rather than relying on code review alone — it's easy to add one convenient sideways import and not notice.
- `app` is the only layer allowed to know about every other layer at once (it wires providers and the router around `pages`).
