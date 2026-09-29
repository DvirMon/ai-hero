# Routing

Which reviewers run, from the files in scope and their code context.
The orchestrator applies this file; agents never re-route themselves.

## 1. Classify

For every file in scope, record:

- **type** — `code` (`.ts`/`.js`, not a test), `test` (`*.spec.ts`,
  `*.test.ts`), `template` (`.html`, or `.ts` with an inline
  `template:`), `style` (`.scss`/`.css`, or `.ts` with `styles:` /
  `[style.*]` / `[class.*]` / `host` style bindings), `doc` (`.md`),
  `other`. A file can have several types.
- **context** — the first config `contexts` entry whose `paths` match:
  `library` or `app` (its `kind`).
- **a11y mode** — first matching `a11y.mode-by-path` entry:
  `design-system` or `feature`; unmatched → `feature`.

A file whose a11y mode is `design-system` is in the **`design-system`
context** for the contract's calibration (§4), on top of its
library/app kind.

## 2. Always on

| Reviewer | Runs when |
|---|---|
| `standards-reviewer` | Always |
| `spec-reviewer` | A spec source was found (SKILL.md §2). None → report `Spec: no spec available` |
| `correctness-reviewer` | Any `code` or `template` file in scope |

A diff of only `doc` / `test` / `other` files runs standards and spec
alone.

## 3. Routed

| Reviewer | Runs when |
|---|---|
| `template-reviewer` | Any `template` file |
| `a11y-reviewer` | Any `template` file; or a `style` file in `design-system` mode |
| `styles-reviewer` | Any `style` file |
| `public-api-reviewer` | A `library` file where the diff touches the `public-surface` barrel, or adds/removes/changes an `export` line (files mode: every `library` file that exports) |
| `security-reviewer` | A sink hit (§4) |

`a11y-reviewer` gets the mode per file. `public-api-reviewer` never runs
for `app` context.

## 4. Security sinks

Grep **added** lines (diff mode) or whole files (files mode). `test`
files never count.

**Always route:**

```
innerHTML|outerHTML|insertAdjacentHTML|bypassSecurityTrust
\beval\(|new Function\(
\[(href|src|srcdoc|action|formaction)\]=
new RegExp\(
TransferState|makeStateKey
```

**Route only in `library` context** — prototype pollution through
merges keyed by row or consumer data:

```
Object\.assign\(
\w+\[[a-zA-Z_$][\w$]*\]\s*=[^=]
```

Object spread (`{ ...x }`) is not a sink: it defines `__proto__` as an
own property instead of setting the prototype. In `app` context the
second list is ignored — apps don't merge untrusted data into shared
structures the way a library engine does.

## 5. Axis ownership (lanes)

Which reviewer owns which contract axis. A finding on another reviewer's
axis is reported only at P0/P1 (contract §6).

| Axis | Owner |
|---|---|
| correctness | `correctness-reviewer` (logic in `.ts`), `template-reviewer` (render logic in templates) |
| performance | `correctness-reviewer` — with `performance.md` only when a hot path is touched (§6) |
| compat | `correctness-reviewer` (runtime, browser, framework version); `public-api-reviewer` (consumer compile/semver) |
| api | `public-api-reviewer` |
| a11y | `a11y-reviewer` |
| security | `security-reviewer` |
| standards | `standards-reviewer`; `styles-reviewer` for style rules; `template-reviewer` for template rules |
| spec | `spec-reviewer` |

`styles-reviewer` has no impact axis of its own: a style leak or broken
override is `correctness` (or `api` in a library), and it owns that
finding because the cause is in a style file.

## 6. References and skills per reviewer

| Passed to | When |
|---|---|
| `performance.md` → `correctness-reviewer` | A changed file matches config `performance.hot-paths` |
| `security.md` → `security-reviewer` | Always |
| `smells.md` → `standards-reviewer` | Always |
| `extra-references` entry → its `for:` reviewer | Always (no `for:` → every reviewer) |
| Skills | `knowledge.skills` + the skills of every context the reviewer's files fall in |

## 7. Disabled

Config `reviewers.disable` removes a reviewer from §2 and §3. The report
lists it under **Not reviewed**. Its lane isn't reassigned.

## 8. Single-pass mode

When the size gate passes (SKILL.md §4 — it requires no
**always-route** sink hit), no agents run. The orchestrator applies §2–§6
itself to pick which references and skills it loads, then reviews as
each selected reviewer in turn.
