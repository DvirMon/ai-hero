# `state.json` schema

The single source of truth for a pipeline workspace's shape. Every skill that
opens `state.json` (`to-ticket`, `grill-with-docs`, `to-spec`, `to-issues`,
`to-tasks`, `implement`) cites this file instead of restating the schema or
the validation routine inline.

## Schema (version 2)

```json
{
  "schemaVersion": 2,
  "runId": "<slug>-<utc-timestamp>",
  "slug": "<slug>",
  "ticketRef": "<id/key returned by the repo's resolved ticket tracker>",
  "ticketUrl": "<url, if the tracker has one>",
  "domainPath": "<path to the owning domain, e.g. libs/shared/table>",
  "workspaceRoot": "<domainPath>/docs/work/<slug>",
  "stack": "react | angular | node | none",
  "isComplex": null,
  "decisionsPath": "<workspaceRoot>/1-decisions.md",
  "capabilityLogPath": "<path to the capability's decisions log, or null>",
  "specPath": null,
  "architecturePath": null,
  "githubIssues": [],
  "createdAt": "<iso8601>",
  "updatedAt": "<iso8601>"
}
```

**A field with no stated consumer does not go in this schema.** That rule is
what keeps a dead field (A14) from recurring — every row below names who
reads it, not just who writes it.

## Fields: owner and consumer

| Field | Owner (writes) | Consumer (reads) |
|---|---|---|
| `schemaVersion` | `to-ticket`, at workspace creation. Never bumped in place — a schema change ships as a new version number and a migration note here. | All six pipeline skills, via the validation routine below (step 2). |
| `runId` | `to-ticket`, at workspace creation. | No skill reads it back. Stated consumer: a human correlating a workspace with the session that created it — cheap correlation, not a telemetry system. Required by this schema's own design brief regardless of automated reads. |
| `slug` | `to-ticket`. | All six pipeline skills (workspace identification); `org/.claude/hooks/pipeline-current-ticket.sh` (argument matching); `ship` (branch name `<type>/<slug>`). |
| `ticketRef` | `to-ticket`. | `grill-with-docs` (fetches the ticket this points at); `pipeline-current-ticket.sh` (displays it in suggested context). |
| `ticketUrl` | `to-ticket`. | `to-ticket` itself, in its own hand-off message to the user (step 5). |
| `domainPath` | `to-ticket`, resolved during workspace creation (step 4's domain-path resolution). | No skill re-reads it today. Stated consumer: any future stage that needs the domain root without re-deriving it from `workspaceRoot` — e.g. locating the domain's own `CONTEXT.md` / `docs/adr/` for cross-referencing. Step 7 made the layout domain-colocated; this is the field that records the domain once instead of re-deriving it every stage. |
| `workspaceRoot` | `to-ticket`. | `grill-with-docs`, `to-spec`, `to-issues`, `to-tasks`, `implement` — every path they read or write is built from this. |
| `stack` | `to-ticket` (asked at intake); `implement` (backfills if missing, per its step 2). | `implement` (routes each step's `Task type` to the matching implementer agent); `to-tasks` (must not leave it null, since `implement` depends on it). |
| `isComplex` | `grill-with-docs`. | `to-spec` (step 4 — gates whether `3-architecture.md` gets written). |
| `decisionsPath` | `to-ticket` (path is fixed at creation; file itself is created lazily by `grill-with-docs`). | `grill-with-docs` (appends decisions); `to-spec` (synthesizes the spec from it). |
| `capabilityLogPath` | `to-ticket`, at creation — the permanent decisions log for the capability this work belongs to (`doc-contracts/decisions-log.md`), if the project keeps them and this work belongs to exactly one capability. `null` otherwise, which is the correct value for cross-capability work, not a missing field. | `grill-with-docs` (reads it before the first question, so the interview does not re-decide something settled; appends a row per capability-scoped decision); `to-spec` (reads it as a second input alongside `decisionsPath` — the log carries what earlier efforts settled, which the workspace's own decisions file does not). |
| `specPath` | `to-spec`. | `to-issues` (default source, read in full); `to-tasks` (read for consistency); `implement` (read only if a step is ambiguous); `ship` (linked as evidence in the PR body). |
| `architecturePath` | `to-spec`, only when `isComplex` is `true`. | `to-issues`, `to-tasks`, `implement` — same read pattern as `specPath`. |
| `githubIssues` | `to-issues` (appends created issue numbers/references). | `to-spec` (step 5 — checks for a prior spec issue before creating a duplicate); `ship` (step 1 and step 5 — pulls the issue number(s) for `Closes #N` in the PR body). |
| `createdAt` | `to-ticket`, at workspace creation. Never updated after. | No skill reads it back today. Paired with `updatedAt`, it is what makes workspace age/staleness computable by a human or a future audit — same class of consumer as `runId`. |
| `updatedAt` | Every skill that writes to `state.json`, on every write (validation routine step 4). | No skill reads it back today. It is what makes staleness detectable at all — a workspace whose `updatedAt` is old relative to its `readiness` rung is a candidate for review. |

### Migration: version 1 → 2

Version 2 adds `capabilityLogPath` and changes nothing else. A version-1 workspace stays valid
— validation step 2 only stops on a version *higher* than the reading skill understands. When a
stage that reads the field meets a version-1 file, step 3 applies as written: the field is
absent, so ask the user for it (or record `null` if the work spans capabilities) and write the
file back at version 2. Do not rewrite version-1 workspaces in bulk.

### Removed in this version (do not reintroduce without a new consumer)

- **`checklist`** (`{ intake, grill, spec, issues, tasks }`, five booleans) — written by
  `to-ticket`, `grill-with-docs`, `to-spec`, `to-issues`, `to-tasks`; read by none. The issue's
  own `## Pipeline` block (see `to-issues`, "The Pipeline block") is the sole record of
  per-stage status now — one copy, not two. `to-issues:198/247`'s original objection to the
  checklist stands independently of this removal: a single workspace-level boolean can never
  answer "is *this* issue planned" on a multi-issue epic.

- **`githubIssues` was NOT removed**, despite being named for removal in the step-8 finding
  (A14: "written by four skills, read by none"). That claim does not hold: `to-spec` reads it
  at step 5 to avoid creating a duplicate spec issue, and `ship` reads it at steps 1 and 5 to
  populate `Closes #N` in the PR body. Both are real, already-documented reads, not new
  consumers invented to save the field. The field stays in the schema; only `checklist` was
  removed.

## Validation routine

Every skill that opens `state.json` follows these four steps before using it.
State it once here; cite it from the calling skill rather than restating it.

1. **Parse.** If `state.json` does not parse as JSON, stop. Report the path. Do not overwrite
   the file — an unparseable file may be mid-write by another process, or hand-edited; guessing
   its intent and clobbering it is worse than asking.
2. **Check `schemaVersion`.** If it is absent, or higher than this skill's own understanding of
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

`to-ticket`, `grill-with-docs`, `to-spec`, `to-issues`, `to-tasks`, `implement` — cite this file
(`to-ticket/references/state-schema.md`) for the schema shape and the validation routine. Do not
paste either back into the calling skill.
