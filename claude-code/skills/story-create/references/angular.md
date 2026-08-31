# Angular — story creation

Generate a Storybook story for an Angular component/library, using a dedicated story-host
component rather than a bare render function — Angular CSF stories wrap a component, they
don't inline JSX like React's do.

If the target project has its own story-conventions doc (check `docs/3-ui/stories.md` or
similar under the library/app being worked on — e.g. `libs/shared/table/docs/3-ui/stories.md`),
treat it as the authoritative, project-specific instance of this pattern and defer to its
specifics (naming, folder layout, shared-fixture files) over the general shape below.

## File layout — one folder per story, one concern per file

```
src/stories/<story-name>/
├── <story-name>-story-host.component.ts     ← the demo component
├── <story-name>-story-host.component.html   ← template — NEVER inline
├── <story-name>.stories.ts                  ← Storybook Meta + exported story objects
└── <story-name>.mdx                         ← thin wrapper: Meta/Canvas/Source only
```

Shared fixtures used by a cluster of related stories (mock rows, schema builders, request
handlers) belong one level up, split by concern — a `.types.ts`, a `.mock.ts`, a `.utils.ts`,
etc. — same as any other Angular code in the repo. Don't inline mock data or a schema/config
call inside the story-host component.

## The story-host component

- **Standalone, separate template.** `templateUrl`/`styleUrl`, never an inline `template:`
  string — a story is still a component and doesn't get an exception for being demo-only.
- **Class name keeps the `Component` suffix** (`GatedEditStoryHostComponent`, not
  `GatedEditStoryHost`) even in a repo that otherwise drops the suffix elsewhere — this is a
  story harness, not a design-system domain component, and the suffix marks that distinction.
- **A doc-comment naming which capability/decision the story proves**, not what it renders.
  Point at the ADR/decision-record id if one exists, and say *why* the story is shaped the way
  it is (why this config and not another, why a value is passed as a signal instead of a plain
  value) — not a restatement of the template.
- State lives in signals on the host, following the same schema/mock split as the file layout
  above. The host wires the library's public API together; it does not reimplement the
  library's own logic.

## One story per mechanism, not per data permutation

Same principle as any framework: a Storybook arg/control that already lets a viewer swap a
value is not a reason for a second story object. Add a new exported story only when the
underlying *behavior* differs (a different feature composed, a different failure mode), and
name/doc-comment it after that capability.

## Mocking actions: buttons over the actions panel

Every mutation a person can trigger needs an on-canvas button calling a real
component/library updater — never a Storybook actions-panel-only trigger, never a bare
`console.log`. A person reading the story should be able to click through the whole flow and
see the resulting state change, not just see an event logged in a side panel.

Two tiers, by how much the story needs to prove:

- **Synchronous, local mutation** — call the update function directly off the button. This is
  the default for most buttons.
- **Simulated server round-trip** — when the story is specifically about save/delete
  reliability (optimistic rollback, pending state, retry), intercept a real `fetch()` with MSW
  rather than stubbing a `Promise`. Thread a `forceFailure` boolean and `latencyMs` number as
  Storybook controls into request headers an MSW handler reads, so the failure/latency path is
  a real intercepted request. Reach for this only when the story's whole point is proving what
  happens on a slow or rejected save — a plain `await` is enough for anything else.

## `.stories.ts` and `.mdx`

- `.stories.ts` defines `Meta` + one exported story object per distinct mode/config the story
  demonstrates. Don't add a second story object for something a control already covers.
- `.mdx` stays a thin wrapper: `Meta`/`Canvas`/`Source`, plus any shared code-tabs block the
  project's other story mdx files reuse. It is not the place to describe what the story proves
  — that's the host component's doc-comment. Add prose to an mdx only when there's a non-obvious
  "why" a reader needs before looking at the code (e.g. explaining a deliberate composition
  choice), not a restatement of what's visible in the canvas.

## Reference implementation

`libs/shared/table/src/stories/` (see `docs/3-ui/stories.md` for the full write-up) —
`gated-edit/` for the fullest example (multiple mutation verbs, a live-wired Storybook arg,
per-row transient UI state kept separate from library state); `live-optimistic/` and
`optimistic-save/` for the MSW/simulated-server-round-trip pattern; `external-write/` for a
story that reacts to an effect from *outside* its own button clicks.
