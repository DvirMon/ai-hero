# visual.md template

`/verify-visual` writes `<tasks root>/visual.md` beside `review.md`, replacing any earlier one.
Fields are read by `/verify-visual` § Re-running and `/ship` § 2 Gate — keep their names exact.

```markdown
# Visual verify — <branch>

- Comparer: <stages.verify-visual.comparer, e.g. figma:visual-verify>
- Verified head: <HEAD sha at run start, before this run's fix commits>
- Fix commits: <sha subject, one per line, cumulative across runs | none>
- Verdict: all clear | open: N | skipped — no Figma frames | stopped — <reason> | failed — <reason>
- Artifact: <claude.ai artifact URL | not published — <reason>>

## States

- <frame> · <state> · <diffAreaPct>% · <verdict> · @<sha>

## Approvals

- <frame> · <state> · <component> · <variant> · <property> · <value> · <reason> · <approver> · <date> | none
```

- **State line** — one per frame × state in `state.json` `figma_states[]`, in that order.
  `<state>` is the state's `open` text.
- **Verdict** — exactly `matching`, `fixed`, `accepted`, `needs approval`, `older difference` or
  `not run`. `needs approval` and `older difference` add `· <property>: Figma <value> · App
  <value> · <component or page code>` per open cluster; a rejected one adds `· rejected:
  <reason>`. `not run` gives the reason in place of the percentage.
- **`diffAreaPct`** — the measured number from the comparer's `report.json`; never omitted on a
  state that ran.
- **`@<sha>`** — the head the state was compared at.
- **Approvals** — this ticket's one-off approvals only. Repo-wide approvals live in
  `docs/agents/verify-visual.md` § Accepted differences.
- Images live under `.pipeline/visual/<branch, / → ->/` and are never committed.
