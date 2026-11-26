# verify-plan.md template

The body `sdlc:test-planner` returns and `/verify-behaviour` writes to
`<tasks root>/verify-plan.md`. One Markdown block per case — no YAML, no schema. Steps are plain
intent; the typed check lines under them decide `passed` or `failed`.

- **Steps** — a short sentence naming each control by its visible label in quotes. No selectors,
  no typed actions: the run finds the control itself.
- **Check lines** — typed, one observable value each:
  - `ui:` visible state in ARIA snapshot style — `role "name" [state]`
  - `net:` `METHOD /path → status · body.field = value`, or `net: none METHOD /path`
  - `db:` `SELECT … → value` — only when the repo facts say DB is enabled
  - `console:` `no errors`, or a given message
- **Case fields** — `Covers` (the quoted requirement line), `Stands for` (items merged into this
  case, or `—`), `Code` (the traced code path), `Why` (why this case exists), `Given` (role and
  fixtures). A case that needs a non-automatable service adds `Blocked: <service>`.

````markdown
<Requirement sources missing: no workspace — only when there is no workspace>

## Fixtures

- `<fixture-id>` — create: <how to create it> · cleanup: <how to remove it>

### c<N> — <title>

- Covers: <ac-N> — "<quoted requirement line>"
- Stands for: <other coverage items this case covers, or —>
- Code: <traced code path>
- Why: <why this case exists>
- Given: role <role> · fixture <fixture-id>

1. <plain-intent step, controls named by "visible label">
   - ui: <role "name" [state]>
   - net: <METHOD /path → status · body.field = value>

Cleanup: <what to remove after the case>

## Not covered

- <coverage item> — <why it was left out>
````

## Example

```markdown
### c7 — Customer turns auto-assign off by hand

- Covers: ac-9 — "Turning the toggle off asks for confirmation"
- Stands for: —
- Code: company-form/toggle-row.component.ts
- Why: only control with a confirm popup
- Given: role full-admin · fixture company-customer-on

1. Switch "Auto-assign by domain" off
   - ui: dialog "Turn off auto-assign?"
   - ui: button "Turn off" [disabled]
2. Click "Cancel"
   - ui: switch "Auto-assign by domain" [checked]
   - net: none PUT /company/*
3. Switch it off again, tick the checkbox, click "Turn off", click "Save"
   - net: PUT /company/{id} → 200 · body.details.auto_assign_by_domain = false
   - db: SELECT auto_assign_by_domain FROM companies WHERE id = {id} → 0

Cleanup: delete the fixture company
```
