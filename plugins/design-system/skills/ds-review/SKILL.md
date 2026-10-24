---
name: ds-review
description: Phase 6 of DS component creation — runs a11y, code, and styles review agents in parallel and fixes issues. Run after ds-scaffold, after the phase-end /compact.
---

# DS Component Builder — Phase 6: Review

## Config

Resolve the config per `${CLAUDE_PLUGIN_ROOT}/contracts/ds-config.md` and read `{conventions}`.
Missing either → stop and point to `/ds-setup`.

---

## On start

Ask the user for the component name, then read `{docsDir}session-handoff.md`.

If Phase 5 is not marked complete → tell the user to finish `ds-scaffold` first.

Read `{docsDir}phase-state.json` and load: `componentFilePath`, `stylesFilePath`, `isComplex`, `planDir`, `a11ySpecText`, and `a11ySpecPath`.

Derive inline `a11ySpec` from the `phase-state.json` keys `a11ySpecText` / `a11ySpecPath` as follows:
- If `isComplex = false` → use the `a11ySpecText` value as inline `a11ySpec`
- If `isComplex = true` → read the file whose relative path is stored in `a11ySpecPath`, resolving that path relative to `{componentPath}` (for example, `a11ySpecPath = "docs/..."` means `{componentPath}docs/...`), and pass its content as inline `a11ySpec`

**Resolve `planDir`** — the versioned plan subfolder for the active version:
1. Read `planDir` from `{docsDir}phase-state.json` (primary source)
2. If `planDir` is not present, fall back to folder discovery: locate the component's plan folder (`{plansDir}`, any `{nnn}`), then inspect its version subfolders (for example `v1-core/`, `v2-enhancement/`)
3. If exactly one version subfolder exists, use it
4. If multiple version subfolders exist, choose the most recently modified version subfolder as the fallback, and tell the user which one you selected; if the user says a different version was scaffolded, use the user-specified version instead
5. If no matching component plan folder or no version subfolders exist, stop and ask the user which scaffolded plan/version folder to use
6. `planDir` = repo-relative path to the selected versioned subfolder

## Launch agents (parallel)

Don't launch all three surfaces (A11y, Code, Styles) by default — reason from `workType` (read alongside the other `phase-state.json` keys above) about which surfaces actually changed:

| workType | Reviewers to launch | Why |
|---|---|---|
| `tokens` | Styles only | No template/class/a11y-contract change — token diff only touches SCSS. |
| `variant` | All three | New API surface touches class (inputs/outputs), template, and its a11y contract. |
| `modify` | Code + whichever of styles/a11y the change actually touches — check `decisions.md`'s recorded change scope; if unclear, run all three | Behavior change may or may not touch styling/a11y; don't assume. |
| `new` | All three | Full component, full surface. |

The reviewers are the `code-review` plugin's agents, run in **files
mode** over the component. This skill owns only the pipeline state; the
plugin owns how to review and what severity means.

"Code" is four plugin agents: `template-reviewer`,
`public-api-reviewer` (the component is part of the DS's public surface),
`standards-reviewer` and `spec-reviewer`. `correctness-reviewer` always
runs with Code.

`public-surface` = the component's own `public-api.ts`, plus `{publicApiBarrel}`
when `publicApi.rootBarrel` is set.

| Surface | subagent_type | extra inputs |
|---|---|---|
| A11y | `code-review:a11y-reviewer` | every file in `design-system` mode; a11y contract = `a11ySpec` (inline text or `a11ySpecPath`); target = `a11y.wcag` |
| Code | `code-review:correctness-reviewer`, `code-review:template-reviewer`, `code-review:public-api-reviewer`, `code-review:standards-reviewer` | `public-surface` (above); `references: [references/ds-code-rules.md, {conventions}]` (template, standards) |
| Code — spec | `code-review:spec-reviewer` | spec sources: `{docsDir}prd.md` and the step files in `{planDir}` (their Acceptance Checks are acceptance criteria) |
| Styles | `code-review:styles-reviewer` | `references: [references/ds-styles-rules.md, {conventions}]`; the resolved `tokens` config |

Every dispatch prompt carries the plugin's common inputs — build them
from `docs/agents/code-review.md` exactly as the plugin's SKILL.md §5
does:

```
scope: files: [componentFilePath, its template (if separate), stylesFilePath, public-api.ts]
contract: <code-review plugin root>/skills/review/references/review-contract.md
files: <path — type — library — design-system>, one per line
standards: <config knowledge.standards, resolved>
decisions: [{docsDir}decisions.md, {docsDir}narrative.md]
skills: <config skills for the design-system context>
```

PRD-vs-code mismatches come back from `spec-reviewer` as `spec`
conformance findings; DS rule breaks from template/standards as
`standards` conformance findings.

If ever unsure which reviewers apply, default to running all of them — a missed reviewer is worse than a wasted one.

## After agents return

**Write `{planDir}/review-issues.md`** before fixing anything. Use this format:

```markdown
# Review Issues — {selector} {version}
<!-- {date} | a11y, code, styles -->

## A11y
- [ ] A1 P0|P1|P2|P3|RULE|SPEC `file.ts:line` one-line description — fix hint

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
- Prefix encodes category + sequence: A=a11y, S=styles, C=code, SB=storybook, D=docs.
  Section by the reviewer that raised it: `a11y-reviewer` → A;
  `styles-reviewer` → S; correctness, template, public-api, standards,
  spec → C. The plugin's kebab-case `id` is dropped; number within the
  section
- Severity comes from the plugin's review contract, unchanged: `P0`–`P3`
  for impact findings; `RULE` (axis `standards`) or `SPEC` (axis `spec`)
  for conformance findings, which carry no P level. A conformance finding
  with `blocking: false` gets ` (non-blocking)` after the description
- P3 findings: at most 5 across all sections, unless the user asks for all
- The plugin's `manual-checks` go under a `## Manual checks` section, one
  line each, no ID — never ticked by this skill
- `file.ts:line` — filename only, no path
- Omit empty sections entirely
- **Marking done**: flip `[ ]` → `[x]` only — never add solution text to the issue line
- **Fixed section**: one line per fix — `[x] {id}: {what changed} ({date})`
- **Dismissed**: flat comment list — `- {id}: {reason}`

Before writing the file, verify P0–P2 and conformance findings exactly as
the plugin's SKILL.md §6 does (review contract §8): drop what's
disproved; an unconfirmed P2 becomes P3.

Present a unified **Review Report** after writing the file: P0–P2 first,
then a Conformance block (RULE / SPEC), then the capped P3 list — never
rank conformance against impact.

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
- `step-*-types-api*` → `code-review:public-api-reviewer` + `code-review:spec-reviewer` (API vs PRD)
- `step-*-component-class*` → `code-review:correctness-reviewer` + `code-review:standards-reviewer`
- `step-*-template*` → `code-review:template-reviewer`
- `step-*-styles*` → `code-review:styles-reviewer`
- `step-*-a11y*` → `code-review:a11y-reviewer` (manual-checks stay `- [ ]`)
- `step-*-tests*` → confirmed when the user reports `commands.test` passing — never run it yourself
- `step-*-storybook*` → confirmed when the user reports `commands.storybook` rendering the stories — never run it yourself

Update `{docsDir}prd.md` acceptance criteria: tick `- [ ]` → `- [x]` for each confirmed criterion, or `- [!]` if flagged.

Update `progress.md` — mark ✅ `completed` or ⚠️ `needs-fix` for each step row.

## Write handoff

Update `{docsDir}session-handoff.md` — mark Phase 6 complete, note any issues fixed.

Print:

```
Review complete.

/compact Keep: componentPath, phase-state.json values, planDir. Drop: reviewer-agent raw findings output and fix-by-fix diff narration — fully captured in review-issues.md, progress.md, and the updated step files already.

Then run `ds-ship <name>` next.
```
