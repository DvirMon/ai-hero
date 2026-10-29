---
paths:
  - "**/*.{ts,tsx,html,css,scss}"
---

# File organization: one concern per file

Split code by concern. Name files `<feature>.<concern>.ts`, not a bare
generic name — avoids collisions between sibling feature folders and
keeps imports self-describing.

| Concern | File | Contents |
|---|---|---|
| Types/models | `<feature>.types.ts` | interfaces, type aliases, enums |
| Store/state | `<feature>.store.ts` | signal store / state container, actions |
| Mock data | `<feature>.mock.ts` | fixtures, sample data for demos and tests |
| Helpers | `<feature>.utils.ts` | pure helper/utility functions |
| Pipeline/derivation logic | `<feature>.pipeline.ts` | data transforms feeding the store (when non-trivial) |
| Feature plugin | `with-<capability>.ts` | one file per opt-in feature (e.g. `with-sorting.ts`), matching its own `.spec.ts` |

Rules:
- No interface/type inline in a component or store file — put it in `<feature>.types.ts`.
- No mock/sample data inline in a component (e.g. a `-demo`) — put it in `<feature>.mock.ts`.
- A folder's `index.ts` is a barrel: re-export the public API only, no logic.
- Keep each file to one concern; when a `.store.ts` accumulates helpers or types, split them out.

Apply to new features and when a file grows past one concern; no
need to rewrite existing single-file components. For pulling a step
into a *named function* in the same file, see
[declarative-naming.md](declarative-naming.md).

## Where code goes: three levels, promote on evidence

1. **Named function, same file** — the default.
2. **Sibling file, one concern** — `<feature>.<concern>.ts`. Correct
   for most domains, permanently.
3. **Folder** — only once a domain outgrows flat (~15 source files).

Promote on evidence, never anticipation: a 150-line feature
pre-split into five files reads worse than one file and ossifies an
unvalidated shape.

## Choosing the folder axis

Name folders after the highest of these that applies:

1. **Contract boundary** — what a consumer touches vs. internal. Always the first cut; "not in the public barrel" is enforceable.
2. **Lifecycle phase** — *when* code runs (declare → compile → run, input → transform → present). A change usually lands in one phase.
3. **Feature/entity** — one folder per independent unit, when units don't know each other and each fills a folder.
4. **Technical kind** (`types/`, `utils/`, `hooks/`) — **avoid.** Nothing is enforced by them and most changes touch all of them.

One concept may span folders under axes 1–2 (declared in one, run in
another); that is the axis working.

## Invariants once nested

- **The folder supplies the domain** — drop the redundant prefix (`engine/pipeline.ts`, not `engine/table.pipeline.ts`).
- **One barrel per domain, not per folder.** One file defines the public surface; anything unlisted is internal.
- **Splitting must not duplicate a declaration.** If two lists must be kept in sync (ordered constant + matching interface, registry + union), derive one from the other.
- **Concept is portable; layout is project-specific.** Folder names come from the domain.

## Domain-scoped docs, colocated

A **domain** = a public API boundary (component, feature, package,
app). It owns its docs, colocated (e.g. a sibling `docs/`), not a
repo-wide dump.

- Inner helpers/sub-components are documented in the parent domain's docs.
- Cross-domain decisions (glossary, architecture-wide ADRs) stay in one shared location.
- Finding a domain's docs means finding its code.
