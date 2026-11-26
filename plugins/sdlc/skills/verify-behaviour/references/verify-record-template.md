# verify.md template

`/verify-behaviour` writes `<tasks root>/verify.md` beside `review.md`, replacing any earlier one.
Fields are read by `/review` § Re-running and `/ship` § 2 Gate — keep their names exact.

```markdown
# Behaviour verify — <branch>

- Browser: <ego-browser | chrome><; net:/console: through Chrome DevTools MCP — when that fallback ran>
- Verified head: <HEAD sha the run tested>
- Fix commits: <sha subject, one per line | none>
- Verdict: all passed | failed: N | stopped — <reason>
- Artifact: <claude.ai artifact URL | not published — <reason>>
<- Requirement sources missing: no workspace — only when there is no workspace>

## Checks

- c<N>.<step>.<line> <passed | fixed | failed | blocked> · <source: ac-N or spec line> · <observed value> · <evidence path | inline> · @<sha>

## Blocked

- c<N>.<step>.<line> — <missing precondition> — test by hand | none

## Data left behind

- <what the run created and did not remove, and where> | none
```

- **Check line** — one per typed check line in `verify-plan.md`, in plan order.
  `<step>` and `<line>` are the step number and the check line's position under it, from 1.
- **Status** — exactly `passed`, `fixed`, `failed` or `blocked`.
- **Observed value** — what the run saw: the ARIA state, the request and response field, the DB
  value, the console line. No observed value → the line is `failed`, never `passed`.
- **Evidence path** — a screenshot under `.pipeline/verify/<branch, / → ->/`, never committed.
  Text evidence (a request/response excerpt, a DB row) goes inline in place of the path.
- **`@<sha>`** — the head the check last ran at. A re-run that keeps a check's earlier result
  keeps its earlier `@<sha>`.
- **`failed` lines** add, after the evidence: `· fix: <suggested fix>`, or
  `· spec question: <the contradiction>` when the check contradicts the spec or code path.
