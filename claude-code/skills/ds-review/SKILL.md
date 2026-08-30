---
name: ds-review
description: Phase 6 of DS component creation — runs a11y, code, and styles review agents in parallel and fixes issues. Run after ds-scaffold, after the phase-end /compact.
---

# DS Component Builder — Phase 6: Review

## Config Setup

Discovers `{projectPath}/.claude/ds-wayfinder.config.json` (walks up from component path):
- Framework (determines review checklist)

Read review handoff: `.claude/skills/ds-review/references/skill-review-handoff.md`

---

## On start

Ask the user for the component name, then read `{componentPath}docs/session-handoff.md`.

If Phase 5 is not marked complete → tell the user to finish `ds-scaffold` first.

Read `{componentPath}docs/phase-state.json` and load: `componentFilePath`, `scssFilePath`, `isComplex`, `planDir`, `a11ySpecText`, and `a11ySpecPath`.

Derive inline `a11ySpec` from the `phase-state.json` keys `a11ySpecText` / `a11ySpecPath` as follows:
- If `isComplex = false` → use the `a11ySpecText` value as inline `a11ySpec`
- If `isComplex = true` → read the file whose relative path is stored in `a11ySpecPath`, resolving that path relative to `{componentPath}` (for example, `a11ySpecPath = "docs/..."` means `{componentPath}docs/...`), and pass its content as inline `a11ySpec`

**Resolve `planDir`** — the versioned plan subfolder for the active version:
1. Read `planDir` from `{componentPath}docs/phase-state.json` (primary source)
2. If `planDir` is not present, fall back to folder discovery: locate the component's plan folder under `.claude/plans/`, then inspect its version subfolders (for example `v1-ngp/`, `v2/`)
3. If exactly one version subfolder exists, use it
4. If multiple version subfolders exist, choose the most recently modified version subfolder as the fallback, and tell the user which one you selected; if the user says a different version was scaffolded, use the user-specified version instead
5. If no matching component plan folder or no version subfolders exist, stop and ask the user which scaffolded plan/version folder to use
6. `planDir` = repo-relative path to the selected versioned subfolder (for example `.claude/plans/001-atera-snackbar/v1-ngp/`)

## Launch agents (parallel)

Don't launch all three by default — reason from `workType` (read alongside the other `phase-state.json` keys above) about which surfaces actually changed:

| workType | Reviewers to launch | Why |
|---|---|---|
| `tokens` | Styles only | No template/class/a11y-contract change — token diff only touches SCSS. |
| `variant` | All three | New API surface touches class (inputs/outputs), template, and its a11y contract. |
| `modify` | Code + whichever of styles/a11y the change actually touches — check `decisions.md`'s recorded change scope; if unclear, run all three | Behavior change may or may not touch styling/a11y; don't assume. |
| `new` | All three | Full component, full surface. |

| Agent | subagent_type | model | Inputs |
|---|---|---|---|
| A11y reviewer | `ds-a11y-reviewer` | sonnet | componentPath, componentFilePath, a11ySpec, planDir |
| Code reviewer | `ds-code-reviewer` | sonnet | componentPath, componentFilePath, planDir |
| Styles reviewer | `ds-styles-reviewer` | sonnet | componentPath, scssFilePath, planDir |

If ever unsure which reviewers apply, default to running all three — a missed reviewer is worse than a wasted one.

## After agents return

**Write `{planDir}/review-issues.md`** before fixing anything. Use this format:

```markdown
# Review Issues — atera-{name} {version}
<!-- {date} | a11y, code, styles -->

## A11y
- [ ] A1 CRIT|HIGH|MED|LOW `file.ts:line` one-line description — fix hint

## Styles
- [ ] S1 ...

## Code
- [ ] C1 ...

## Storybook
- [ ] SB1 ...

## Docs
- [ ] D1 ...

## Dismissed
<!-- issue-id: reason -->
- A3: reason

## Fixed
<!-- populated as issues are resolved -->
```

Rules for this format:
- One line per issue — description ≤ 12 words, fix hint ≤ 8 words after `—`
- Prefix encodes category + sequence: A=a11y, S=styles, C=code, SB=storybook, D=docs
- Severity: CRIT / HIGH / MED / LOW
- `file.ts:line` — filename only, no path
- Omit empty sections entirely
- **Marking done**: flip `[ ]` → `[x]` only — never add solution text to the issue line
- **Fixed section**: one line per fix — `[x] {id}: {what changed} ({date})`
- **Dismissed**: flat comment list — `- {id}: {reason}`

Present a unified **Review Report** grouped by severity after writing the file.

Fix issues:
- Simple fixes (single-line, obvious) → fix inline directly, mark `[x]`, add to Fixed section
- Larger changes → re-launch the relevant scaffolder agent

### Update progress tracking

For each step file in `planDir`, tick off acceptance checks based on reviewer findings:
- Reviewer confirmed → `- [x]`
- Reviewer flagged → `- [!] {brief note}`
- Not applicable → leave `- [ ]`

Set `Status` at top of each step file:
- All `[x]` → `Status: completed`
- Any `[!]` → `Status: needs-fix`

Step file → reviewer mapping:
- `step-*-types-api*`, `step-*-component-class*`, `step-*-template*` → `ds-code-reviewer`
- `step-*-styles*` → `ds-styles-reviewer`
- `step-*-a11y*` → `ds-a11y-reviewer`
- `step-*-tests*` → confirmed by `nx test` passing
- `step-*-storybook*` → confirmed by `npm run sb` passing

Update `docs/prd.md` acceptance criteria: tick `- [ ]` → `- [x]` for each confirmed criterion, or `- [!]` if flagged.

Update `progress.md` — mark ✅ `completed` or ⚠️ `needs-fix` for each step row.

## Write handoff

Update `{componentPath}docs/session-handoff.md` — mark Phase 6 complete, note any issues fixed.

Print:

```
Review complete.

/compact Keep: componentPath, phase-state.json values, planDir. Drop: reviewer-agent raw findings output and fix-by-fix diff narration — fully captured in review-issues.md, progress.md, and the updated step files already.

Then run `ds-ship <name>` next.
```
