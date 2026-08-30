# Deferred Loading with `@defer`

`@defer` splits components/directives/pipes inside the block into a separate JS chunk and loads it lazily. Use for below-the-fold content, heavy third-party components, or anything not needed on initial render.

**Requirement:** deferred dependencies must be standalone and not referenced outside the `@defer` block (including `viewChild` queries).

## Sub-Blocks

| Block | Required | Description |
|---|---|---|
| `@defer { }` | yes | Primary block — lazily loaded content |
| `@placeholder { }` | recommended | Shown before trigger fires; eagerly loaded |
| `@loading { }` | no | Shown while loading; replaces `@placeholder` |
| `@error { }` | no | Shown if deferred loading fails; eagerly loaded |

```html
@defer (on viewport) {
  <heavy-chart />
} @placeholder (minimum 200ms) {
  <div class="chart-skeleton"></div>
} @loading (after 100ms; minimum 500ms) {
  <app-spinner />
} @error {
  <p>Failed to load chart.</p>
}
```

## Triggers

| Trigger | Fires when… |
|---|---|
| `on idle` | browser is idle (default; optional `timeout` param) |
| `on viewport` | `@placeholder` or a `#ref` enters the viewport |
| `on interaction` | user clicks or presses a key on the element |
| `on hover` | mouse hovers the element |
| `on immediate` | immediately after non-deferred content renders |
| `on timer(500ms)` | after the specified delay |
| `when condition` | custom signal/boolean expression becomes truthy (one-shot) |

Multiple triggers are OR-combined with `;`:

```html
@defer (on idle; on interaction) { ... }
```

## Prefetching

Load the JS chunk earlier than the trigger displays the content:

```html
@defer (on interaction; prefetch on idle) {
  <large-form />
} @placeholder {
  <button>Open form</button>
}
```

## Custom Viewport Options

```html
<div #anchor>...</div>
@defer (on viewport({trigger: anchor, rootMargin: '100px', threshold: 0.5})) {
  <heavy-cmp />
}
```

## Accessibility

Wrap `@defer` in an `aria-live` region so screen readers announce state transitions:

```html
<div aria-live="polite" aria-atomic="true">
  @defer (on timer(2s)) {
    <user-profile />
  } @placeholder {
    Loading profile…
  } @error {
    Failed to load profile.
  }
</div>
```

## Gotchas

- **Barrel file imports** kill lazy splitting — import directly from `./heavy.component`, not from `./index`.
- **SSR/SSG**: `@defer` renders `@placeholder` on the server; use Incremental Hydration to render main content server-side.
- **HMR**: all defer chunks load eagerly during `ng serve` — test split with `ng serve --no-hmr`.
- **`@placeholder` minimum** prevents flicker for fast connections.
- **`@loading after`** prevents showing a spinner for very fast loads.

## Testing

```ts
TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual });
const fixture = TestBed.createComponent(MyCmp);
const [block] = await fixture.getDeferBlocks();

await block.render(DeferBlockState.Loading);
expect(fixture.nativeElement).toContain('Loading…');

await block.render(DeferBlockState.Complete);
expect(fixture.nativeElement).toContain('heavy content');
```
