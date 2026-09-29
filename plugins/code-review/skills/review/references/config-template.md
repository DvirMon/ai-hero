# Config template

The per-repo config lives at `docs/agents/code-review.md`: a short
heading, one fenced `yaml` block, a Notes section. This file defines
every key, its default, and how `init` fills it.

**Assume no structure.** A repo may have no ADRs, no rules, no knowledge
base, no issue tracker, no monorepo tool. Nothing below is expected to
exist; every signal is something to look for, never something to rely on.

## Keys

Defaults assume nothing about the repo: a missing key means "this input
doesn't exist here", and the reviewer that needs it works without it.

| Key | Meaning | Default |
|---|---|---|
| `contexts.<name>.paths` | Globs owned by this context; first match wins | one context, `paths: ["**"]` |
| `contexts.<name>.kind` | `library` or `app` | `app` |
| `contexts.<name>.public-surface` | Entry file(s) consumers import from (`library` only) | none → `public-api-reviewer` doesn't run |
| `contexts.<name>.typecheck` | Command run once after applying fixes | none → report says no typecheck ran |
| `contexts.<name>.skills` | Skills for this context's files | `[]` |
| `a11y.mode-by-path` | Glob → `design-system` or `feature` | `{}` → everything `feature` |
| `a11y.contracts` | A11y contract docs for design-system mode | `[]` |
| `knowledge.skills` | Skills for every reviewer | `[]` |
| `knowledge.standards` | Rule files `standards-reviewer` cites | `[]` → Standards axis reports `no standards documented`; smells still run |
| `knowledge.decisions` | Decision records that override findings | `[]` |
| `knowledge.commit-rule` | Doc (path, optionally `#heading`) stating the commit rule | none → commit-story check skipped |
| `performance.hot-paths` | Globs where `performance.md` applies | `[]` |
| `reviewers.disable` | Reviewer names to skip | `[]` |
| `reviewers.extra-references` | `{path, for?}` docs passed to reviewers | `[]` |
| `spec.issue-contract` | Doc describing how to fetch an issue | none → `gh issue view` when the remote is GitHub, else issues aren't fetched |
| `spec.issue-workspace` | Glob to an issue's folder; `{n}` = issue number | none |
| `spec.doc-names` | Filenames that count as a domain's spec | `[]` |

## `init` — discover, then ask

### Step 1 — Discover (automatic, no questions)

For each key, look for **signals by content and role, not by name**.
Record, per key, one of: **found** (with the evidence), **candidates**
(weak matches), or **nothing**.

| Key | Signals to look for |
|---|---|
| contexts | Workspace manifests of any tool (`project.json`, `package.json` workspaces, `pnpm-workspace.yaml`, `angular.json`, `Cargo.toml`, …). No manifest → one context at the root |
| kind | A manifest marking the project publishable (`exports`/`main`/`publishConfig`, a library project type) → `library`; else `app` |
| public-surface | The file a manifest's `exports`/`main`/`types` or build config points to |
| typecheck | A script or target whose command runs a type checker (`tsc`, `ngc`, `vue-tsc`, `mypy`, …) |
| skills | Framework dependencies in manifests, matched against installed skills |
| a11y.mode-by-path | Folders exporting reusable UI primitives consumed elsewhere in the repo |
| a11y.contracts | Docs whose content is about roles, keyboard, focus, ARIA or WCAG |
| standards | Files an agent or contributor is told to follow: agent instruction files (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules`, `.github/copilot-instructions.md`, …), contributing/style guides, docs whose content is imperative rules |
| commit-rule | A doc stating how commits must be split or written (commit conventions, a contributing guide section) |
| decisions | Docs recording a decision with its context and consequences, in any format or folder (ADR-shaped or not) |
| hot-paths | None discoverable — always nothing |
| extra-references | Docs defining design tokens or styling conventions |
| issue-contract | A doc explaining how issues are created/read in this repo |
| issue-workspace | Folders or files named or keyed by issue number |
| doc-names | Per-domain docs that describe intended behavior (spec, PRD, requirements) |

Read enough of a file to judge its role; a filename alone is a
candidate, not a find.

### Step 2 — Ask, only where discovery didn't settle it

One key per question, with AskUserQuestion, one question at a time. Ask
only for keys whose result is **candidates** or **nothing**; **found**
keys are shown in the final draft, not asked.

Every question has, in this order:

1. up to two discovered candidates (paths or values), if any — the most
   likely first, marked `(Recommended)`
2. `None in this repo` — this input doesn't exist here; write an empty
   value so later runs don't ask
3. `Skip` — don't configure this key now; leave it out, the default
   applies

The user can always type a value through "Other". Validate a typed
path before accepting it (it must match something).

Ask in this order — earlier answers shape later questions:
contexts → kind → public-surface → typecheck → standards → commit-rule →
decisions →
spec keys → a11y keys → hot-paths → extra-references → skills.
A key that doesn't apply given earlier answers (public-surface for an
`app`) is not asked.

### Step 3 — Confirm and write

Show the full draft, with Notes listing, per key: `found` (and the
evidence), `answered`, `none` or `skipped`. Then one AskUserQuestion:
**Write it** / **Edit first** / **Don't write**. Write only on approval.
Don't commit.

## Validation (construction errors)

Checked before every review. The skill stops on the first error, naming
the key and value:

- a path or glob that matches nothing
- `kind` other than `library` / `app`
- `public-surface` on an `app` context
- a reviewer name in `disable` or `for:` that doesn't exist

Not errors: a skill that isn't installed (reviewers report it under
`not-reviewed`); an empty list (means "none in this repo").

## Output shape

````markdown
# Code review config

Read by the `code-review` plugin — locally and in CI. Missing keys fall
back to the plugin defaults.

```yaml
<keys — skipped keys omitted, "none" keys written as empty>
```

## Notes

<per key: found (evidence) | answered | none | skipped>
````
