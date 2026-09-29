---
name: code-review
description: Review a diff (since a commit, branch, tag or merge-base) or a named set of files, and report findings ranked by practical impact on consumers — blocking P0–P2 in full, P3 capped — with standards and spec conformance in a separate block. Fans out to subject reviewer agents routed by file type and per-repo config, then verifies and merges. Also generates the per-repo config (`init`). Use to review a branch, a PR, work-in-progress changes, "review since X", or a component's files.
---

# Code review — orchestrator

Runs in the main session and dispatches agents itself. Agents never
dispatch agents.

Three references define everything this file doesn't restate:

- [review-contract.md](${CLAUDE_PLUGIN_ROOT}/skills/code-review/references/review-contract.md)
  — severity, evidence, finding format, verify, reporting, hand-off.
- [routing.md](${CLAUDE_PLUGIN_ROOT}/skills/code-review/references/routing.md)
  — which reviewers run, lanes, references per reviewer.
- [config-template.md](${CLAUDE_PLUGIN_ROOT}/skills/code-review/references/config-template.md)
  — config keys, defaults, validation, `init`.

## Arguments

| Argument | Effect |
|---|---|
| a fixed point (`main`, SHA, `HEAD~5`, tag) | **diff mode** |
| `files: <paths or globs>` | **files mode** (whole-file review) |
| `init` | Generate the config (§0.2) and stop |
| `report-only` | Skip §8 hand-off |
| `exhaustive` | All P3 in full; same as effort high/max |

**CI** = running non-interactively (e.g. `claude-code-action`). CI
implies `report-only` and never writes the config.

## 0. Config

### 0.1 Load

Read `docs/agents/code-review.md` in the reviewed repo.

- **Present** → validate it (config-template.md § Validation). An error
  is a construction error: stop, name the key and value, no review. In
  CI, post that as the summary comment.
- **Missing, local** → go to §0.2. If the user declines the draft, run on
  defaults.
- **Missing, CI** → run on defaults.

Running on defaults: the report's first line is
`config: defaults — run /code-review:code-review init`. Ask again on the
next local run; never remember a decline.

### 0.2 Generate (`init`, or a missing config locally)

Follow config-template.md § `init`. Assume no repo structure.

1. **Discover** every key automatically — by file content and role, not
   by expected names.
2. **Ask** only for keys discovery didn't settle: one AskUserQuestion
   per key, one at a time, each offering discovered candidates,
   `None in this repo` and `Skip`.
3. **Confirm** the full draft; write `docs/agents/code-review.md` only on
   approval. Don't commit.

`init` alone → stop here. Otherwise continue the review with the new
config — or on defaults if the user chose **Don't write**.

## 1. Scope

**Diff mode.** Pin the fixed point:

- Given → use it.
- None, on a feature branch → `git merge-base origin/<default> HEAD`,
  `<default>` from `git symbolic-ref --short refs/remotes/origin/HEAD`.
  `git fetch origin` first. Say which base you used.
- None, on the default branch or detached → ask.

Capture once: `git diff <base>...HEAD` and
`git log <base>..HEAD --oneline`. Confirm `git rev-parse <base>` resolves
and the diff is non-empty — fail here, not inside agents.

**Files mode.** Expand the globs; fail on an empty set.

Classify every file per routing.md §1.

## 2. Spec sources

Collect every source; a diff can span several domains.

1. **Issues** — refs in commit messages (`Refs: #N`, `#N`) and, when a PR
   exists, its body's `Closes #N` / `Refs #N` (`gh pr view --json body`).
   Fetch per `spec.issue-contract`. For each, if `spec.issue-workspace`
   is set, resolve it with `{n}` = the number: its spec and step files
   are sources for that issue.
2. **Domain docs** — for each file, walk up to the nearest `docs/`
   holding any `spec.doc-names` file. One doc set per domain; domain docs
   outrank an issue for that domain's own files.
3. A path the user passed.
4. Nothing found → local: ask; if there is none, `spec-reviewer` doesn't
   run. CI: don't ask. Either way the report says
   `Spec: no spec available`.

## 3. Standards and decisions

Resolve `knowledge.standards` and `knowledge.decisions` to file lists.
A rule file with glob frontmatter is kept only when its globs match a
file in scope (no frontmatter → keep). Pass paths, not contents.

Either list may be empty — that's a valid repo. Empty standards →
`Standards: no standards documented` (smells still run). Empty
decisions → nothing overrides findings.

## 4. Size gate

Single pass in the main context, no agents, when **all** hold:

- ≤ 150 changed lines (diff mode) or ≤ 3 files (files mode)
- routing.md §3 selects at most one routed reviewer
- no **always-route** security sink (routing.md §4)

Then run routing.md §8 and continue at §6.

## 5. Fan-out

Pick reviewers per routing.md §2–§3. Dispatch all of them in **one
message**, in parallel. Agent names are namespaced:
`code-review:<reviewer>`.

Every dispatch prompt carries:

```
scope: diff: <cmd> | files: [...]
commits: <git log output>            # diff mode
contract: ${CLAUDE_PLUGIN_ROOT}/skills/code-review/references/review-contract.md
files: <path — type — context — a11y mode>, one per line
standards: [...]                      # §3
decisions: [...]                      # §3
skills: [...]                         # routing.md §6
references: [...]                     # routing.md §6
<reviewer-specific inputs, below>
```

| Reviewer | Extra inputs |
|---|---|
| `spec-reviewer` | Per domain: folder + doc paths. Per issue: number, fetched body, workspace path |
| `public-api-reviewer` | `public-surface` of each touched library context |
| `a11y-reviewer` | `a11y.contracts` |
| `standards-reviewer` | `commit-rule`: config `knowledge.commit-rule`, when set |

Carry every agent's `not-reviewed` into the report.

## 6. Verify

Apply review-contract.md §8 to every P0–P2 and conformance finding:
re-read the line, walk the failure scenario / sink path yourself, open
the cited rule or criterion. Record `confidence`.

More than ~10 findings to verify → dispatch one `general-purpose` agent
with the list, the contract path and this section; use its verdicts.

## 7. Merge and report

- **Dedupe** — same file, lines within ±3, same root cause → one
  finding; keep the higher severity; list every reviewer that raised it.
- **Rank** — impact findings P0 → P3, then by routing.md §5 order.
- **Report** — review-contract.md §9, in this order:

```
config: defaults — …           ← only when running on defaults
blocking: N | no blocking findings

## Findings                    ← P0–P2 in full, inline at their line
## Conformance
Standards: pass | fail (N)
Spec:      pass | fail (N) | no spec available
## P3                          ← ≤5 one-liners, then "+N more"
## Manual checks
## Not reviewed                ← disabled reviewers, missing skills, no spec
```

Close with the single worst finding, one line. Any P0/P1 security
finding → also suggest the built-in `/security-review`.

## 8. Hand-off

Skipped with `report-only` and in CI. Otherwise apply
review-contract.md §10, one finding at a time. Then:

- Run each touched context's `typecheck` once. None configured → say so.
- Never build, serve or run tests — say what's worth running.
- Don't commit.
