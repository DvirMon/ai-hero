# Visual comparer

What the `/verify-visual` stage asks of a comparer. This contract names no comparer. The
stage resolves one from `stages.verify-visual.comparer` in `.claude/workflow.json`
([`workflow-config.md`](workflow-config.md)); the default is `figma:visual-verify`, from the
`figma` plugin. `sdlc` does not depend on that plugin: a repo without Figma never runs the
stage.

The comparer knows nothing about the pipeline. It never reads or writes `state.json`,
`progress.md` or `visual.md`, and never decides what runs next. It compares and renders;
classifying, fixing, approvals, the record and the gate are the stage's.

## Input

The stage invokes the comparer as a skill, with one of two calls.

**compare** — args `compare <input.json>`:

```json
{
  "outDir": ".pipeline/visual/<branch>",
  "devUrl": "http://localhost:4200",
  "componentPrefix": "v-",
  "frames": [{ "fileKey": "…", "nodeId": "4275:4279", "name": "company-page" }],
  "states": [{ "nodeId": "4275:4279", "route": "/company/1",
               "open": "Turn off dialog open", "role": "full-admin" }],
  "crop":   [{ "selector": ".last-updated", "reason": "date" },
             { "region": [0, 0, 1200, 48], "reason": "user name in header" }]
}
```

- `states[].open` is plain intent naming controls by visible label; `default` opens nothing.
- `states[].role` is `null` for the signed-in user.
- `crop[]` entries carry either `selector` or `region` (`[x, y, w, h]`), never both.

**render** — args `render <report.json> <out.html>`: the stage passes `report.json` with its
verdicts filled in.

## What the comparer may do

- **May** take screenshots (Figma and app), run the pixel diff, read styles and the DOM, and
  write files under `outDir` and the `render` output path.
- **Never** edits source files, commits, pushes, or touches the tracker.
- **Never** starts, stops or restarts the dev server, and never enters credentials.
- **Never** writes a verdict, except `not run` with a reason for a state it could not open
  (another role, a control it could not find).
- **Never** states a style value it did not read from a real source (Figma metadata, code,
  computed style). Unread values are `unverified`.

## Output

**compare** writes `<outDir>/report.json` and one image dir per state (Figma, app, diff PNGs).
Per section (one per frame × state), beside the fields its renderer needs:

| Field | Meaning |
|---|---|
| `diffAreaPct` | measured differing area, percent; absent only when `verdict` is `not run` |
| `sizeMismatch` | the two images differ in size; the stage fixes this before the diff counts |
| `copy` | `[{ figma, app }]` — visible text that differs from the Figma text |
| `clusters` | `[{ x, y, w, h, property, figmaValue, appValue, fromComponent, component, variant }]` |
| `verdict` | empty, or `not run` with `note` holding the reason |

`fromComponent` is the `componentPrefix` tag whose own styles set the value (e.g. `v-button`),
`null` when page code sets it, or `"unverified"` when the comparer cannot tell. `component`
and `variant` name the component instance when `fromComponent` is a tag.

**render** writes the HTML page at the given path and returns that path. Publishing it is the
stage's.

## Failure

| Case | Class | Stage does |
|---|---|---|
| `stages.verify-visual.comparer` names a skill that isn't installed | construction | stop, name the key and the skill |
| comparer errors, or `compare` leaves no `report.json` | runtime | record `Verdict: failed — <reason>`, commit nothing, report it — `/ship` shows it at the gate |
