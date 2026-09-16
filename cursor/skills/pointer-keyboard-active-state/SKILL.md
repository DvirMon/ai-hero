---
name: pointer-keyboard-active-state
description: TRIGGER when building/fixing any listbox, combobox, menu, or "roving active item" list where BOTH mouse hover and keyboard arrow-nav set an active/highlighted item (search overlays, autocomplete dropdowns, command palettes, select menus, dropdown menus). Fixes the classic bug — "highlight stuck on stale hover after keyboard nav moves active elsewhere" — without a global mousemove/keydown modality hack. Framework-agnostic (Angular, React, Vue, vanilla).
portedFrom: 55c696faac16
portedSelf: 55c696faac16
---

# Pointer + keyboard active-item conflict

## The bug

List of rows. Active/highlighted row is set two ways: mouse hover, and keyboard
arrow-key nav. Symptom: hover a row, then press ArrowDown — the row the mouse is
still resting on stays highlighted too, alongside the new keyboard-active row. Two
rows lit up at once. The mouse didn't move, so its native `:hover` state is still
true — CSS never got told the keyboard took over.

A second, subtler version of the same bug: even after fixing the above (single JS
`activeIndex`, no CSS `:hover`), keyboard nav can trigger `scrollIntoView()`, which
shifts the DOM under a *stationary* cursor — the browser fires a synthetic
`mouseenter`/`mousemove` at the old coordinates anyway, and that synthetic event
steals active back from the row the keyboard just selected.

## Wrong fix

A global "which modality is active" flag (`document.addEventListener('keydown', ...)`
+ `mousemove` to clear it, toggle a body class, gate `:hover` behind
`.user-is-tabbing`). This is the WICG `:focus-visible` polyfill pattern — it solves
"should focus rings show," not "which list row is highlighted." Applied here it's
overkill, easy to wire wrong (global listeners, cleanup, SSR/dispose edge cases), and
still needs per-row logic on top of it.

## Right fix, step 1: single source of truth, not two

Stop using CSS `:hover` for the highlight at all. Highlight is driven **only** by one
piece of state — `activeIndex` (or `activeId`) — and both input sources write to the
*same* state:

- **Keyboard**: ArrowUp/ArrowDown handler sets `activeIndex`.
- **Pointer**: `mouseenter`/`mousemove` on each row sets `activeIndex` to that row.

CSS highlights only `[data-active]` / `.is-active`, never `:hover`.

This alone fixes the first (common) version of the bug. It does not fix the
scroll-into-view/synthetic-event version — that needs step 2.

## Right fix, step 2: filter synthetic pointer events geometrically

**Recommended: Headless UI's `useTrackedPointer` technique** — no timing heuristic,
just compare the pointer's actual screen position against the last known position.
A synthetic pointer event fired by a DOM shift always reports the *same* coordinates
the cursor was already at; a real pointer event never does.

```
lastScreenX, lastScreenY = -1, -1

onEnter(event):              # seed baseline only, don't activate yet
  lastScreenX, lastScreenY = event.screenX, event.screenY

onMove(event):
  if event.screenX == lastScreenX and event.screenY == lastScreenY:
    return                    # no real movement — synthetic event, ignore
  lastScreenX, lastScreenY = event.screenX, event.screenY
  activate(row)
```

Use `screenX`/`screenY` (screen-space), not `clientX`/`clientY` (viewport-space) —
`client*` changes when the page scrolls even if the cursor is physically still,
which reintroduces exactly the false positive this is meant to filter out.

This is deterministic (no magic-number window that can be too short for a slow
scroll or too long for a fast real move) and needs no cleanup/timer/`DestroyRef`
wiring. Verified against Headless UI's actual shipped source
(`use-tracked-pointer.ts`, both React and Vue builds) and cross-checked against
Radix (`pointermove` + `pointerType==='mouse'`, weaker — still has open "hover
steals keyboard highlight" issues from post-scroll synthetic moves) and React
Aria/Adobe (sidesteps the conflict entirely by keeping hover and active as separate,
non-interacting states — an option if the design doesn't require hover and keyboard
to share one highlight).

### Fallback: ng-primitives' ignore-window (if a geometric check isn't practical)

`ng-primitives-a11y`'s `activeDescendantManager` uses a ~200ms `setTimeout` after any
keyboard-origin move — a pointer-origin activate is a no-op while that flag is set.
Their own source comment: `// 200ms should be enough for scroll to complete`. It's a
real, shipped, production technique — just a heuristic rather than a hard guarantee
(a slow smooth-scroll can outlast 200ms; a fast genuine mouse move right after a
keydown gets briefly swallowed). Reach for this only when the geometric check can't
be wired (e.g. the event objects aren't available at the point where filtering needs
to happen).

## Angular example (geometric fix, as implemented in this repo)

Row component — pointer tracking lives here, not in the parent, since each row needs
its own last-known-position baseline:

```ts
export interface TrackedPointer {
  wasMoved(event: MouseEvent): boolean;
  update(event: MouseEvent): void;
}

export function createTrackedPointer(): TrackedPointer {
  let lastScreenX = -1;
  let lastScreenY = -1;
  return {
    wasMoved(event) {
      if (event.screenX === lastScreenX && event.screenY === lastScreenY) return false;
      lastScreenX = event.screenX;
      lastScreenY = event.screenY;
      return true;
    },
    update(event) {
      lastScreenX = event.screenX;
      lastScreenY = event.screenY;
    },
  };
}
```

```ts
@Component({
  host: {
    '[attr.data-active]': "active() ? '' : null",
    '(mouseenter)': 'onPointerEnter($event)',
    '(mousemove)': 'onPointerMove($event)',
  },
})
export class Row {
  readonly active = input(false, { transform: booleanAttribute });
  readonly activate = output<string>();
  private readonly pointer = createTrackedPointer();

  protected onPointerEnter(event: MouseEvent): void {
    this.pointer.update(event); // seed baseline, don't activate
  }

  protected onPointerMove(event: MouseEvent): void {
    if (this.pointer.wasMoved(event)) this.activate.emit(this.id);
  }
}
```

Parent — no pointer/timing logic at all, since each row already filtered synthetic
events before emitting:

```ts
private readonly activeIndex = signal(0);

onRowActivate(id: string): void {
  const i = this.items().findIndex(x => x.id === id);
  if (i >= 0) this.activeIndex.set(i);
}

onKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') this.activeIndex.update(i => wrap(i + 1, this.items().length));
  if (e.key === 'ArrowUp') this.activeIndex.update(i => wrap(i - 1, this.items().length));
}
```

```css
/* never .row:hover */
.row[data-active] { background: var(--accent-solid); }
```

## React example (geometric fix)

```tsx
function useTrackedPointer() {
  const last = useRef<[number, number]>([-1, -1]);
  return {
    wasMoved(e: React.MouseEvent) {
      const [x, y] = last.current;
      if (e.screenX === x && e.screenY === y) return false;
      last.current = [e.screenX, e.screenY];
      return true;
    },
    update(e: React.MouseEvent) {
      last.current = [e.screenX, e.screenY];
    },
  };
}

function Row({ id, active, onActivate }: RowProps) {
  const pointer = useTrackedPointer();
  return (
    <div
      data-active={active ? '' : undefined}
      onMouseEnter={(e) => pointer.update(e)}
      onMouseMove={(e) => { if (pointer.wasMoved(e)) onActivate(id); }}
    />
  );
}
```

```css
/* never .row:hover */
.row[data-active] { background: var(--accent-solid); }
```

### Fallback snippet (ng-primitives-style ignore-window)

Only reach for this if the geometric check above isn't wireable:

```ts
const IGNORE_POINTER_MS = 200;
let ignoringPointer = false;
let ignoreTimer: ReturnType<typeof setTimeout>;

function moveActive(delta: number) {
  activeIndex = wrap(activeIndex + delta, items.length);
  ignoringPointer = true;
  clearTimeout(ignoreTimer);
  ignoreTimer = setTimeout(() => { ignoringPointer = false; }, IGNORE_POINTER_MS);
}

function activateFromPointer(id: string) {
  if (ignoringPointer) return;
  activeIndex = items.findIndex(x => x.id === id);
}
```

## Reference implementation in this repo

`apps/ng-table/src/app/design-system/search/`:
- `search-overlay.utils.ts` — `createTrackedPointer()`
- `search-result-row.ts`, `search-recent-row.ts` — host-bound rows using it
  (`onPointerEnter`/`onPointerMove`, emit `activate`)
- `search-overlay.ts` — `activeResultIndex` signal, `onRowActivate()`, `moveActive()`
- `search-overlay.css` — `[data-active]`-only highlight rules, no `:hover`

Confirmed working in-browser (2026-08-23): keyboard nav no longer gets stolen back by
a stale hover, and genuine mouse movement — including movement within a row the
cursor is already inside — still reclaims the highlight.
