# Review contract

Every reviewer — the orchestrator's own single pass and every reviewer
agent — follows this file. It is the only definition of severity,
evidence and output. Agents never restate it.

**The goal is signal, not coverage.** Report what materially affects the
people who consume this code: library users, app users, the next
maintainer. A review with zero findings is a valid, expected result.
Never invent a finding to justify the pass.

## 1. Two kinds of finding

| Kind | Axes | Graded by | Reported in |
|---|---|---|---|
| Impact | correctness, security, performance, a11y, api, compat | Severity P0–P3 (§2), evidence (§3) | Findings |
| Conformance | standards, spec | Citation (§5) — not by consumer impact | Conformance |

The two are never ranked against each other, so one can't hide the
other. A rule violation that *also* causes a defect is two findings: the
conformance one cites the rule, the impact one shows the failure.

## 2. Severity (impact findings)

| Level | Meaning | Blocks the PR |
|---|---|---|
| **P0** | Security hole, data loss or corruption, catastrophic failure (table blank, app crash on load) | Yes |
| **P1** | Definite bug or regression in core behavior; public-API break — runtime **or type-level**; crash; broken render | Yes |
| **P2** | Concrete correctness, performance, accessibility, lifecycle or compatibility issue hit by realistic usage; or new public API that would need a breaking change to fix after release | Yes |
| **P3** | Everything else: real but limited, uncommon edge case, maintainability, ergonomics, defensive coding, style, preference | No |

P3 carries one tag: `minor` (real, limited impact) · `improvement` (no
defect; better code) · `nit` (style, naming, preference).

Type-level breaks count as P1 because type inference is part of the
product: an exported type that widens to `any`, an overload that stops
matching a previously valid call, an inferred member that disappears.

## 3. Evidence — what earns P0–P2

**A P0–P2 finding states a concrete, realistic failure.** Without it, the
finding is P3, however plausible it sounds. "Could", "might", "in theory"
and "if someday" are P3 words.

| Axis | Evidence required for P0–P2 |
|---|---|
| Correctness | Inputs or state → the wrong output, crash or broken render they produce |
| Public API | A consumer snippet that compiled/worked before and breaks now, or a new surface that cannot change later without a breaking release |
| Security | A path from untrusted input (row data, consumer config, URL, user typing) to a dangerous sink (`innerHTML`, `bypassSecurityTrust*`, `[href]`, `new RegExp`, object keys/merge). No reproduction needed; the path is the evidence |
| Performance | A named, realistic scale and trigger ("10k rows, every filter keystroke") and what degrades. "Could be slow" is P3 |
| Accessibility | The WCAG 2.2 success criterion and the affected user ("a keyboard user cannot reach the expand toggle") |
| Async / lifecycle | One concrete interleaving or sequence (A starts, B starts, A resolves last → stale rows), or a leak with its trigger |
| Compatibility | The supported environment or version where it fails |

Not findings at any level:

- restating what the code does, or praising it
- alternatives with no advantage named
- issues in code the diff does not touch — unless the diff makes them
  reachable; then it is the diff's finding
- anything tooling already enforces (lint, typecheck, commit hooks)
- a case a documented decision (ADR, decisions log) already rules on —
  cite the decision instead

## 4. Context calibration

The repo's config (`docs/agents/code-review.md`) names each path's
context. Context moves severity; it never changes the evidence rule.

| Context | Shifts |
|---|---|
| `library` (published package) | Public-API and type-level issues rank up — a fix after release is a breaking change. Ergonomics of a **new** public surface can be P2 |
| `design-system` | Accessibility of a component that owns a pattern ranks up — a defect reaches every consumer |
| `app` | API ergonomics and internal naming are P3. A type-inference regression is P2, not P1. Accessibility of composition (labels, focus, announcements) stays P2 when evidenced |

## 5. Conformance findings

No P level. Their evidence is a citation; no citation, no finding.

- **Standards** — cites the rule (`CLAUDE.md`, `.claude/rules/*`, an ADR)
  and the line that breaks it. **Blocking** unless the rule itself calls
  the point optional. A preference no rule states is not conformance —
  it is an impact P3 `nit`.
- **Spec** — cites the acceptance criterion, spec section or issue text.
  **Blocking** when an acceptance criterion is unmet or the diff does
  something the spec excludes. States **which side to fix**: `code` (the
  diff is wrong) or `docs` (the spec or docs are stale and the code is
  right).

## 6. Scope and lanes

The orchestrator passes one scope:

- `diff: <git diff command>` — changed lines, plus unchanged lines the
  change breaks (a caller of a changed signature).
- `files: [...]` — whole-file review; any line is in scope.

Each reviewer owns its axes. A finding outside your lane is reported only
if it is P0 or P1 — otherwise drop it; the owning reviewer has it.

## 7. Output format

Every reviewer returns this and nothing else:

~~~yaml
reviewer: <agent name>
findings:
  - id: short-kebab-slug
    axis: correctness | standards | spec | a11y | security | performance | api | compat
    severity: P0 | P1 | P2 | P3           # impact axes only
    tag: minor | improvement | nit        # P3 only
    blocking: true | false                # conformance axes only (§5)
    file: path/relative/to/repo.ts
    line: 42
    summary: One sentence stating the defect.
    evidence: The failure scenario / sink path / criterion / citation from §3 or §5.
    fix: One or two sentences, or "none obvious".
    fix-side: code | docs                 # spec axis only
    confidence: confirmed | plausible     # set by the verify pass, not the reviewer
manual-checks:                            # optional — only a human can verify
  - <what to check, where>
not-reviewed:                             # optional — skipped input and why
  - <e.g. skill angular-developer not installed>
~~~

`findings: []` when there are none. `summary` states the defect, not the
fix. `evidence` is what makes it P0–P2; if you cannot fill it, the
finding is P3. `manual-checks` are never findings and never assumed
passing.

## 8. Verify pass

Run by the orchestrator before merging. Each P0–P2 finding and each
conformance finding is challenged: try to show the failure cannot happen
(a guard upstream, a type that forbids the input, an existing test
covering it), or that the cited rule / criterion doesn't say that.

- Disproved → dropped.
- Not reproduced but not disproved → `plausible`, severity drops one
  level (P2 → P3). Conformance: dropped — a citation either holds or not.
- Shown or traced end to end → `confirmed`.

P3 findings are not verified.

## 9. Reporting

- The summary opens with the verdict: `blocking: N` or
  `no blocking findings`. N counts P0–P2 plus blocking conformance
  findings.
- **P0–P2** — every one, inline at its line, ranked by severity.
- **Conformance** — one line per axis, always shown:
  `Standards: pass | fail (N)`, `Spec: pass | fail (N) | no spec
  available`; each failing finding inline at its line.
- **P3** — at most 5 one-line entries in the summary, highest value
  first, then a count of the rest. Never inline.
- **Exhaustive** — all P3 findings in full, only when asked or at
  `high`/`max` effort.
- **Manual checks** and **Not reviewed** — listed when non-empty.

## 10. Hand-off to the implementing agent

| Finding | Action |
|---|---|
| P0–P2, correctness / security / a11y / performance / compat | Fix |
| P0–P2 that changes public API shape | Propose to the user; do not apply |
| Standards, blocking | Fix |
| Spec, `fix-side: code` | Fix |
| Spec, `fix-side: docs` | Fix the doc, or ask when the doc is a decision record |
| P3 | Leave as information. Apply a P3 only when the same file is already being edited for another reason and the fix is mechanical (rename, dead import, typo) |

In CI, or with `report-only`: nothing is applied.
