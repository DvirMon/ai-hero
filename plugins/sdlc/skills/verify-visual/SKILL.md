---
name: verify-visual
description: "Compare every Figma frame and state of a branch against the running app, measured with a pixel diff, before code review. Figma wins on page layout and page colour; the design system wins inside a v-* component, and those differences go to the developer to approve once per repo. Fixes small branch-caused differences as verify commits, records the result in visual.md and publishes it as an Artifact. Use after /implement, before /review."
disable-model-invocation: true
---

# Verify visual

The stage between `/implement` and `/review`. It checks that the built UI matches the Figma
frames — measured, never by eye — and knows when Figma is wrong: where Figma contradicts a
design-system component, the component wins and the developer approves the difference.

- The comparison runs in the comparer skill (`stages.verify-visual.comparer`, default
  `figma:visual-verify`), per [`visual-comparer.md`](../../contracts/visual-comparer.md). The
  stage never calls a comparer script.
- Never starts, stops or restarts the dev server; never enters credentials.
- No Figma frames on the ticket → the stage skips. No visual checks without frames.
- A difference coming from a `v-*` component's own styles is never fixed toward Figma.
- Never "matches" without a measured `diffAreaPct`.

## 1. Resolve

1. Read the workflow config per `${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md` § Reading
   it. `stages.verify-visual.skill: "none"` never reaches here — the stage is skipped. Load
   `stages.verify-visual.skills` per `${CLAUDE_PLUGIN_ROOT}/contracts/stage-skills.md`.
2. **Frames** — `state.json` `figma[]` empty, or no workspace → `Verdict: skipped — no Figma
   frames`. Say so, write no record, commit nothing, then § 8 with Next `/review`.
3. **Frame states** — `figma[]` set but no `figma_states[]` → stop: the plan predates
   `figma:steps` writing frame states. Rerun `/to-tasks`, or add `figma_states[]` by hand
   (shape: `skills/to-ticket/references/state-schema.md`).
4. **Comparer** — `stages.verify-visual.comparer` (default `figma:visual-verify`) not
   installed → construction error: stop, name the key and the skill. `visual-verify` still
   listed on `stages.implement.skills` → construction error: stop, say to move it to
   `stages.verify-visual.comparer`.
5. **Settings** — `devUrl` from the ticket's project. None → stop, point to `/sdlc:setup`.
6. **Repo facts** — `docs/agents/verify-visual.md` (§ Accepted differences, § Crop rules, and
   § Design system when there is no `.claude/design-system.json`). Missing → stop, point to
   `/sdlc:setup`.
7. **Design system** — `componentPrefix` and component paths from `.claude/design-system.json`
   (`prefix`, component paths) when it exists, else from `docs/agents/verify-visual.md`
   § Design system. One owner per value: never copy one into the other.
8. **Branch** — run `${CLAUDE_PLUGIN_ROOT}/contracts/branch-guard.md`, including § Override.
9. **Tasks root** — as `/review` § 1.4 resolves it.
10. **Clean tree.** `git status --porcelain` empty — the stage's fixes must be the only changes
    it commits. Leftovers → stop; they belong to `/implement`.

## 2. Compare

`<run dir>` = `.pipeline/visual/<branch, / → ->/` (gitignored; images are never committed).

1. **Dev server.** `curl -s -o /dev/null -w '%{http_code}' <devUrl>` — `000` → stop. Never
   start the server. Print a manual checklist of frames × states, record per § 6 with
   `Verdict: stopped — dev server not running` (no Artifact), then § 8.
2. Write `<run dir>/input.json` per the contract's **compare** input: `outDir` = `<run dir>`,
   `devUrl`, `componentPrefix`, `frames` from `figma[]` (`fileKey`, `nodeId`, `label` as
   `name`), `states` flattened from `figma_states[]`, `crop` from § Crop rules.
3. Invoke the comparer: `compare <run dir>/input.json`. It errors, or leaves no
   `<run dir>/report.json` → record `Verdict: failed — <reason>`, commit nothing, report it.
4. A section with `sizeMismatch: true` → its layout is fixed (§ 4) or reported before its
   `diffAreaPct` counts.

## 3. Classify

Each cluster, first match wins:

1. **Accepted** — matches an entry in `docs/agents/verify-visual.md` § Accepted differences or
   this ticket's `visual.md` § Approvals → `accepted`. A match needs the same component +
   variant + property + value, and, on the frame and state where the entry was approved
   (its `Seen at`), a cluster that still sits there: its centre inside the recorded box and
   its area at most 1.5× the box's. A difference that grew or moved no longer matches: it is
   new. On other frames and states, a repo entry matches on the four fields alone (that is
   the repo-wide reuse); a ticket entry never does.
2. **From a component** — `fromComponent` is a tag or `"unverified"` → `needs approval`,
   never fixed. Inner padding, height, font and colour of a `v-*` component all land here. A
   margin or position on the component's outer tag is page layout: the comparer gives it
   `fromComponent: null`, so it goes to rule 4.
3. **Dynamic content** — inside a crop rule's selector or region → expected, not counted.
4. **Page code** — `fromComponent: null` (position, spacing between elements, alignment,
   colour set by page code) → Figma wins → § 4.

Copy differences (`copy[]`) → § 4: Figma wins on wording, unless the copy key is shared i18n
text other screens use → `needs approval`.

**Branch-caused** = the element's template or stylesheet is in
`git diff --name-only $(git merge-base origin/<default> HEAD)..HEAD`. Otherwise the difference
is `older difference`: reported, never fixed here.

## 4. Fix small / report big

**Small** = the same rule as `/verify-behaviour` § 6
([SKILL.md](../verify-behaviour/SKILL.md)), applied to a page-code or copy difference the branch
caused. Fix it, then re-compare that state: the comparer's `compare` with only that state and
`outDir` = `<run dir>/recheck/<state id>/`, so the full `report.json` is kept. Merge the new
section (images, `diffAreaPct`, clusters) back into `<run dir>/report.json` in place of the old
one. Smaller `diffAreaPct` and the cluster gone → commit per
`${CLAUDE_PLUGIN_ROOT}/contracts/commit.md` — type `fix` (or `style` for a pure style value),
stage `verify`, staged by path — and mark it `fixed`. Not gone → `git restore` your edits and
treat it as big.

**Big** = branch-caused but not small → `needs approval` with the suggested fix; the developer
fixes it or approves it for this ticket (§ 5).

## 5. Approve

In chat, one difference per question, with `AskUserQuestion`. Each question names the frame,
state, component, variant, property, Figma value and app value, the reason it is not fixed, and
the Figma / App / Diff image paths. Options:

- **Approve for the repo** — append a row to `docs/agents/verify-visual.md`
  § Accepted differences:
  `| <component> | <variant> | <property> | <app value> | <seen at> | <reason> | <git user.name> | <date> |`,
  where `<seen at>` = `<frame> · <state> · <x>,<y>,<w>,<h>` (the cluster box at 1x).
- **Approve for this ticket** — a line in `visual.md` § Approvals with the same fields.
- **Reject** — stays `needs approval` with `rejected` and the developer's reason: an open
  failure to fix.

Approved clusters become `accepted`.

## 6. Record

1. **Section verdicts** — per state, the first that applies: `not run` (from the comparer) ·
   `needs approval` (any open cluster) · `older difference` (only older differences left) ·
   `accepted` (any accepted cluster left) · `fixed` (fixed this run, nothing left) ·
   `matching` (no clusters). Write them into `report.json` (`verdict`, `note`), plus the fix
   list (`fixes`).
2. **Verdict** — `all clear` when no state is `needs approval` and at least one state was
   measured; `stopped — no state could run` when every state is `not run`; `open: N` (states
   `needs approval`); or `skipped — no Figma frames` · `stopped — <reason>` ·
   `failed — <reason>`.
3. Write `<tasks root>/visual.md` beside `review.md`, replacing any earlier one, in the format
   of [`visual-record-template.md`](references/visual-record-template.md).
4. Order: write `visual.md`, publish (§ 7), fill its `Artifact:` field, then commit.
5. When the tasks root is in the repo, commit `visual.md` together with any
   `docs/agents/verify-visual.md` update from § 5 — these two files and nothing else — per
   `commit.md`: type `docs`, subject `record visual verify`, stage `verify`.

## 7. Publish

Invoke the comparer: `render <run dir>/report.json <run dir>/visual.html`. Publish the HTML with
the Artifact tool (`icon: "chart"`). A re-run publishes with `url` = the earlier `visual.md`'s
`Artifact:` URL, so the link stays the same.

## 8. Next

Name the next stage. The stage does not start it.

| Outcome | Next |
|---|---|
| every state `matching`, `fixed`, `accepted`, `older difference` or `not run` | `/review` (or `/ship` when `stages.review.skill` is `none`) |
| any `needs approval` | fix it, then `/verify-visual` again |
| `stopped` or `failed` | fix the cause, `/verify-visual` again |
| `skipped — no Figma frames` | `/review` |

End with the pointer as the very last line:

```
Next: <stage> <issue-#-or-slug>
```

## Re-running

A re-run compares every state again at the current `HEAD` and keeps this ticket's earlier
§ Approvals. `Fix commits` is cumulative: carry forward every earlier entry still in the
branch's history, then add this run's.

**Verify commits** follow `/verify-behaviour` § Re-running
([SKILL.md](../verify-behaviour/SKILL.md)), with `visual.md` as the record: its record commit
changes only `visual.md` and `docs/agents/verify-visual.md`.

**Stale** = a commit in `<Verified head>..HEAD` that is none of: a visual verify commit, a
review commit (`/review` § Re-running: a listed review fix commit or the `review.md` commit),
or a behaviour verify commit (`/verify-behaviour` § Re-running). Those stages run after this
one by design. Judged by SHA and paths, never by subject. `/ship` shows a stale record at its
gate.
