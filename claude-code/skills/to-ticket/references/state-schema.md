# `state.json` schema

The single source of truth for a pipeline workspace's shape. Every skill that
opens `state.json` (`to-ticket`, `grill-with-docs`, `to-spec`, `to-issues`,
`to-tasks`, `impel`) cites this file instead of restating the schema or
the validation routine inline.

## Schema (version 4)

```json
{
  "schemaVersion": 4,
  "runId": "<slug>-<utc-timestamp>",
  "slug": "<slug>",
  "ticketRef": "<id/key returned by the repo's resolved ticket tracker>",
  "ticketUrl": "<url, if the tracker has one>",
  "domainPath": "<path to the owning domain, e.g. libs/shared/table>",
  "workspaceRoot": "<domainPath>/docs/work/<slug>",
  "stack": "react | angular | node | none",
  "isComplex": null,
  "decisionsPath": "<workspaceRoot>/1-decisions.md",
  "prdPath": "<the docs.prd path, resolved>",
  "capabilityLogPath": "<path to the capability's decisions log, or null>",
  "figma": [],
  "designPath": null,
  "specPath": null,
  "architecturePath": null,
  "units": [],
  "createdAt": "<iso8601>",
  "updatedAt": "<iso8601>"
}
```

`figma[]` entry shape (see `references/figma-capture.md`):

```json
{
  "label": "Session row",
  "fileKey": "g7SaJ3BzmMA4yzStMWV48m",
  "nodeId": "4275:4279",
  "screenshotPath": "figma/session-row.png"
}
```

`screenshotPath` is optional when capture failed or not run yet; `label`, `fileKey`, and
`nodeId` are required on each row.

`units[]` entry shape — one per PR unit. What a unit is follows `prUnit` in
`doc-contracts/workflow-config.md`: `sub-issue` → one entry per sub-issue; `ticket` → one entry
for the ticket (its Jira sub-tasks are steps on that branch and are not units).

```json
{
  "remoteRef": "#42 | PROJ-123 | <local id>",
  "branch": "feat/42-row-export",
  "worktree": "../ng-table-42",
  "pr": null,
  "readiness": "ready-for-agent",
  "assessed": "10-23 · <one-line reason>"
}
```

`remoteRef` is required. `branch`, `worktree`, `pr`, `readiness`, `assessed` start `null`.
`worktree` stays `null` when `isolation` is `branch`. `readiness` + `assessed` are the record
only on Jira; on GitHub the issue's `## Pipeline` body block is the record and both stay `null`.

Step files live in `<workspaceRoot>/tasks/` — not `4-tasks/` (see "Reading version 3").

**A field with no stated consumer does not go in this schema.** That rule is
what keeps a dead field (A14) from recurring — every row below names who
reads it, not just who writes it.

## Fields: owner and consumer

| Field | Owner (writes) | Consumer (reads) |
|---|---|---|
| `schemaVersion` | `to-ticket`, at workspace creation. Never bumped in place — a schema change ships as a new version number and a migration note here. | All six pipeline skills, via the validation routine below (step 2). |
| `runId` | `to-ticket`, at workspace creation. | No skill reads it back. Stated consumer: a human correlating a workspace with the session that created it — cheap correlation, not a telemetry system. Required by this schema's own design brief regardless of automated reads. |
| `slug` | `to-ticket`. | All six pipeline skills (workspace identification); `org/.claude/hooks/pipeline-current-ticket.sh` (argument matching); `to-ticket`, `grill-with-docs`, `to-spec`, `to-issues` (the epic's planning branch, `docs/<slug>`). It does **not** name issue branches — each issue's branch is `<type>/<N>-<slice-slug>`, recorded in that unit's `units[].branch`. |
| `ticketRef` | `to-ticket`. | `grill-with-docs` (fetches the ticket this points at); `pipeline-current-ticket.sh` (displays it in suggested context). |
| `ticketUrl` | `to-ticket`. | `to-ticket` itself, in its own hand-off message to the user (step 5). |
| `domainPath` | `to-ticket`, resolved during workspace creation (step 4's domain-path resolution). | No skill re-reads it today. Stated consumer: any future stage that needs the domain root without re-deriving it from `workspaceRoot` — e.g. locating the domain's own `CONTEXT.md` / `docs/adr/` for cross-referencing. Step 7 made the layout domain-colocated; this is the field that records the domain once instead of re-deriving it every stage. |
| `workspaceRoot` | `to-ticket`. | `grill-with-docs`, `to-spec`, `to-issues`, `to-tasks`, `impel` — every path they read or write is built from this. |
| `stack` | `to-ticket` (asked at intake); `impel` (backfills if missing, per its step 2). | `impel` (routes each step's `Task type` to the matching implementer agent); `to-tasks` (must not leave it null, since `impel` depends on it). |
| `isComplex` | `grill-with-docs`. | `to-spec` (step 4 — gates whether `3-architecture.md` gets written). |
| `prdPath` | `to-ticket`, at creation — the `docs.prd` path from the workflow config, resolved for this work (`doc-contracts/prd.md`). | `grill-with-docs` (adds `[Dn]` requirements, marks `⚠ Dn`); `to-spec` (re-fetches remote ACs into it, stops on an open `⚠`). |
| `decisionsPath` | `to-ticket` (path is fixed at creation; file itself is created lazily by the first stage that decides something). Format: `doc-contracts/ticket-decisions.md`. | Every stage appends entries tagged with its phase: `grill-with-docs` (`grill`), `to-spec` (`spec`), `to-tasks` (`tasks`), `impel` (`implement`, `review`). `to-spec` also synthesizes the spec from it. |
| `capabilityLogPath` | `to-ticket`, at creation — the permanent decisions log for the capability this work belongs to (`doc-contracts/decisions-log.md`), if the project keeps them and this work belongs to exactly one capability. `null` otherwise, which is the correct value for cross-capability work, not a missing field. | `grill-with-docs` (reads it before the first question, so the interview does not re-decide something settled; appends a row per capability-scoped decision); `to-spec` (reads it as a second input alongside `decisionsPath` — the log carries what earlier efforts settled, which the workspace's own decisions file does not). |
| `figma` | `to-ticket` (capture per `references/figma-capture.md`); `grill-with-docs` may append frames after user supplies missing ones. | `grill-with-docs` (Design-check aspect frame list); `to-spec` (frame table in `design.md`); `to-issues` (node IDs on FE slices); `to-tasks` (step `figma:` binding); `impel` (which nodes to fetch per UI step). |
| `designPath` | `to-spec`, when `figma[]` is non-empty or grill left `design.draft/` / design-check decisions to promote. | `to-issues`, `to-tasks`, `impel` (component/token/copy map — UI steps treat absent mapping as stop); `ship` (MR evidence link). |
| `specPath` | `to-spec`. | `to-issues` (default source, read in full); `to-tasks` (read for consistency); `impel` (read only if a step is ambiguous); `ship` (linked as evidence in the PR body). |
| `architecturePath` | `to-spec`, only when `isComplex` is `true`. | `to-issues`, `to-tasks`, `impel` — same read pattern as `specPath`. |
| `units` | `to-ticket` (writes the entries per `prUnit`, starts each branch/worktree per `isolation`); `to-issues` (appends a unit per created sub-issue when `prUnit` is `sub-issue`); `grill-with-docs` (sets `readiness` + `assessed` on Jira); `to-tasks` (sets `branch` + `worktree` for a unit it starts itself); `ship` (sets `pr`). | `to-tasks` (`branch`, `worktree`); `impel` (`readiness` on Jira); `ship` (`remoteRef` for the closing reference, `branch`, `pr`). While `pr` is `null`, look it up with `gh pr list --head <branch>`. |
| `createdAt` | `to-ticket`, at workspace creation. Never updated after. | No skill reads it back today. Paired with `updatedAt`, it is what makes workspace age/staleness computable by a human or a future audit — same class of consumer as `runId`. |
| `updatedAt` | Every skill that writes to `state.json`, on every write (validation routine step 4). `ship` writes only `units[].pr`. | No skill reads it back today. It is what makes staleness detectable at all — a workspace whose `updatedAt` is old relative to its `readiness` rung is a candidate for review. |

### Reading version 3

Workspaces created before v4 keep `schemaVersion: 3`. Every stage still reads them — validation
step 2 accepts 3 — by mapping in memory. Write v4 only: the first write upgrades the file. Do not
bulk-migrate.

| v3 | v4 |
|---|---|
| `schemaVersion: 3` | `4`, on the next write |
| each `githubIssues[]` entry (issue number or tracker key) | one `units[]` entry: `remoteRef` = the entry as a string (`42` → `"#42"` on GitHub; Jira keys as-is) |
| — | `units[].branch` / `.worktree` = the unit's `progress.md` header (`**Branch:**`, `**Worktree:**`) when present, else `null` |
| — | `units[].pr` = `null` (look up with `gh pr list --head <branch>`) |
| — | `units[].readiness` / `.assessed` = `null`; on Jira, ask or re-assess before a stage that reads them |
| — | `prdPath` = `null`; a stage that reads it asks (validation step 3) |
| a `githubIssues[]` entry that is the old spec issue (the tracker shows it as the spec) | no unit — it was never a PR unit, and v4 publishes no spec |
| step files in `<workspaceRoot>/4-tasks/` | read in place; new step files go to `tasks/` |

### Migration: version 2 → 3

Version 3 adds `figma` (default `[]`) and `designPath` (default `null`). When a skill reads a
version-2 file, add both fields with those defaults and bump `schemaVersion` to 3 on the next
write. Do not bulk-migrate workspaces.

### Migration: version 1 → 2

Version 2 adds `capabilityLogPath` and changes nothing else. A version-1 workspace stays valid
— validation step 2 only stops on a version *higher* than the reading skill understands. When a
stage that reads the field meets a version-1 file, step 3 applies as written: the field is
absent, so ask the user for it (or record `null` if the work spans capabilities) and write the
file back at version 2. Do not rewrite version-1 workspaces in bulk.

### Removed (do not reintroduce without a new consumer)

- **`githubIssues`** (v4) — replaced by `units[]`, which holds the same remote refs for any
  tracker plus each unit's git facts. Its `to-spec` read (prior spec issue) went with the spec
  issue itself: the spec is never published to a tracker.

- **`checklist`** (v3; `{ intake, grill, spec, issues, tasks }`, five booleans) — written by
  `to-ticket`, `grill-with-docs`, `to-spec`, `to-issues`, `to-tasks`; read by none. The issue's
  own `## Pipeline` block (see `to-issues`, "The Pipeline block") is the record of
  per-stage status now (on Jira, `units[].readiness`) — one copy, not two. `to-issues:198/247`'s original objection to the
  checklist stands independently of this removal: a single workspace-level boolean can never
  answer "is *this* issue planned" on a multi-issue epic.

### Per-unit git facts

v3 kept branch, worktree and PR out of `state.json`. v4 records them in `units[]`, so every
stage reads one sync map for any tracker. Each unit's branch and worktree are written once,
when the unit starts; only `pr` and (on Jira) `readiness` change later.

- **Issue open/closed** → the tracker; `issue-graph.md` carries edges only.

## Validation routine

Every skill that opens `state.json` follows these four steps before using it.
State it once here; cite it from the calling skill rather than restating it.

1. **Parse.** If `state.json` does not parse as JSON, stop. Report the path. Do not overwrite
   the file — an unparseable file may be mid-write by another process, or hand-edited; guessing
   its intent and clobbering it is worse than asking.
2. **Check `schemaVersion`.** Version 3 is read through the mapping in "Reading version 3". If
   it is absent, or higher than this skill's own understanding of
   the schema (i.e. this file describes an older version than what's on disk), stop and report
   — do not guess at what a newer or unversioned shape means. A schema-version bump belongs in
   this file, alongside a migration note, before any skill is taught to read the new shape.
3. **Check the fields this stage reads.** For each field the calling skill's own process
   section reads (see the "Consumer" column above), confirm it is present and non-null. If one
   is missing, ask the user for it — the same create-if-missing behavior the six pipeline
   skills already document for a missing `state.json` entirely, just applied field-by-field to
   an existing one.
4. **On write:** set `updatedAt` to the current ISO 8601 timestamp, and preserve every key not
   owned by the writing stage (see the "Owner" column above) exactly as read — a partial-field
   write must never drop sibling keys. The write itself runs in a writer agent, never inline —
   `file-writes.md`. Steps 1–3 stay in the calling session.

## Consuming skills

`to-ticket`, `grill-with-docs`, `to-spec`, `to-issues`, `to-tasks`, `impel` — cite this file
(`to-ticket/references/state-schema.md`) for the schema shape and the validation routine. Do not
paste either back into the calling skill.
