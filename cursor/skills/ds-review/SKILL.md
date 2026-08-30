---
name: ds-review
description: Phase 6 of DS component creation — runs a11y, code, and styles review in sequence and fixes issues. Run after ds-scaffold, after the phase-end context trim.
---

# DS Component Builder — Phase 6: Review

There is no subagent dispatch mechanism here — the Claude Code version runs a11y, code, and styles reviewers in parallel. Do each applicable review **yourself, in this same session, one after another** in the order below, then fix what they find. Each reviewer's substance is folded in below.

## Config Setup

Discover `{projectPath}/.claude/ds-wayfinder.config.json` (walk up from component path):
- Framework (determines review checklist)

Read review handoff: `~/.cursor/skills/ds-review/references/skill-review-handoff.md`

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

## Decide which reviews apply

Don't run all three by default — reason from `workType` (read alongside the other `phase-state.json` keys above) about which surfaces actually changed:

| workType | Reviews to run | Why |
|---|---|---|
| `tokens` | Styles only | No template/class/a11y-contract change — token diff only touches SCSS. |
| `variant` | All three | New API surface touches class (inputs/outputs), template, and its a11y contract. |
| `modify` | Code + whichever of styles/a11y the change actually touches — check `decisions.md`'s recorded change scope; if unclear, run all three | Behavior change may or may not touch styling/a11y; don't assume. |
| `new` | All three | Full component, full surface. |

If ever unsure which reviews apply, default to running all three — a missed review is worse than a wasted one.

## Review 1 — A11y (per the table above)

**Purpose:** Verify the implemented component matches its a11y spec and meets WCAG 2.1 AA baseline. Catches the gap between spec and code — automated tools catch ~40%, manual keyboard/SR/contrast checks catch the rest.

**Inputs:** componentPath, componentFilePath, a11ySpec (resolved above), planDir.

**Process:**
0. Confirm `a11ySpec` has a fully-disposed WCAG Success Criteria Traceability table (no blank rows) — if missing/incomplete, flag CRIT immediately; the spec is incomplete and review can't confirm full coverage regardless of how clean the code looks.
1. Load `a11ySpec`, extract expected semantic element, ARIA contract, keyboard map, focus contract.
2. Read `componentFilePath`, diff actual implementation against spec section by section.
3. Run any automated a11y tooling available in this project (axe-core / Lighthouse) for findings on semantic HTML, ARIA attributes, and contrast.
4. Manually trace keyboard interaction against the spec's key map: Tab/Shift+Tab order, no keyboard traps, Enter/Space activation, arrow-key navigation where applicable, Escape dismissal, no conflicting shortcuts.
5. Manually trace the focus contract — initial focus, trap (if modal), restoration on close, visible/distinct focus indicator (including high-contrast mode).
6. Script through screen reader announcement expectations (name on focus, role, state, aria-live changes, error messages, labels/descriptions) and flag mismatches.
7. Check contrast values against WCAG AA thresholds (text 4.5:1, graphics/UI components 3:1), including the disabled state.
8. Check touch target sizes in rendered styles (44x44px minimum, spacing, documented exceptions).
9. Check motion/reduced-motion CSS and JS triggers — no flashing >3/second, animations dismissible, `prefers-reduced-motion` variant works.
10. Check zoom/text-resize behavior — 200% zoom with no horizontal scroll, text sizing respected.
11. Check form label/error/validation wiring if the component has inputs — `<label for>`/aria-label/aria-labelledby, aria-describedby/aria-errormessage linkage, required marking, aria-invalid on validation.
12. For each traceability row marked "Applies," verify the implementation actually addresses it — don't just trust the spec's claim.
13. Compile findings, assign severity: CRIT (blocks AA compliance / breaks SR or keyboard use entirely), HIGH (AA violation, partial breakage), MED (best-practice gap, workaround exists), LOW (polish/consistency).

Review targets rendered markup and runtime behavior, not framework source patterns — don't flag framework-specific implementation choices unless they produce a non-compliant DOM/ARIA/keyboard/focus result.

**Acceptance check:** traceability table confirmed complete before scoring anything else; every "Applies" row spot-checked against real implementation; all ten categories (semantic HTML, ARIA, keyboard, focus, screen reader, contrast, touch targets, motion, zoom, forms) checked; each finding tagged CRIT/HIGH/MED/LOW with `file:line`, expected vs actual; manual-only checks marked as manually verified, not assumed from automated tooling.

## Review 2 — Code (per the table above)

**Purpose:** Verify the implemented component class/template matches its PRD and DS Angular conventions, independent of styling and accessibility (covered by the other two reviews).

**Inputs:** componentPath, componentFilePath, planDir.

**Process:**
1. Read `docs/prd.md` — extract API Summary and Internal DS Components table; read `docs/decisions.md` and `docs/narrative.md` (if present) — note any decision that pre-empts a convention check below (a documented decision overrides a convention/PRD-derived finding it explicitly addresses — cite the decision instead of flagging).
2. Read `componentFilePath` and its template in full.
3. Diff the decorator against `~/.cursor/skills/ds-research/references/component-class.angular.md` conventions — flag any deviation (explicit `standalone: true`, missing `OnPush`, `NgModule` wrapping).
4. Diff every input/output/content-slot in code against the PRD API Summary — flag mismatches, omissions, undocumented extras.
5. Check `host` for theme class, variant/state class bindings, ARIA attribute bindings — flag anything found in the template instead.
6. Check type definitions are colocated in `.component.ts` and correctly re-exported (not redefined) in `public-api.ts`; check `index.ts` has no logic.
7. Cross-check every Internal DS Component import against the PRD table's exact import paths — flag any reimplementation or path mismatch.
8. Verify the wired primitive matches research/architecture's decision — flag substitutions or unexplained hand-rolled behavior.
9. Assess file organization against `srpClassification` and the repo's file-organization rule — flag files mixing concerns that should be split.
10. Review template control flow (`@if`/`@for` correctness) and content-slot selectors (attribute selectors preferred for named slots); flag any stray class binding that belongs in `host`, and any `protected` method invoked from a non-event binding purely to compute a render value (should be `computed()` or `@let` instead — event-binding calls like `(click)="activate(item)"` are exempt).
11. Confirm registration in the design system's root barrel.
12. Cross-reference findings against the relevant step files' Acceptance Checks in `planDir`.
13. Compile findings with severity: CRIT (breaks compilation/public API contract, wrong primitive entirely), HIGH (convention violation with real consumer impact), MED (organization/hygiene gap with a workaround), LOW (polish/consistency).

**Acceptance check:** decisions/narrative docs read and cited where they pre-empt a finding; decorator conventions checked; every input/output/content-slot diffed against the PRD; theme class and variant/state/ARIA bindings verified as `host`-bound; type colocation and barrel-purity verified; every Internal DS Component cross-checked against its documented path; primitive wiring verified; file organization assessed; each finding tagged CRIT/HIGH/MED/LOW with `file.ts:line`, ≤12-word description, ≤8-word fix hint; no finding invents a rule not present in the PRD, DS conventions, or the file-organization rule.

## Review 3 — Styles (per the table above)

**Purpose:** Verify the implemented stylesheet matches DS styling conventions and the styles plan step, independent of markup correctness and a11y contrast/touch-target checks (though findings here should flag anything that would surface as an a11y finding at the source).

**Inputs:** componentPath, scssFilePath, planDir.

**Process:**
1. Read `scssFilePath` in full.
2. Read the styles step in `planDir` — extract the expected token table, override API, and locked tokens.
3. Read `docs/decisions.md` and `docs/narrative.md` (if present) — note any decision that pre-empts a convention check below.
4. Read `docs/prd.md`'s Variants & States table for coverage checking.
5. Scan for raw hex/RGB or palette-token usage — flag every instance; role tokens only.
6. Check `:host` is the styling root; flag any styling-only wrapper element.
7. Search for `::ng-deep` — flag every instance regardless of scoping.
8. Search for `ViewEncapsulation.None` — for each hit, confirm the projected content has no fixed part-set; flag if it does (a directive-per-part approach was skippable) or if `None` is used without host-class-scoped selectors.
9. Spot-check a sample of token usages against `docs/research-summary.md`'s Figma token list for correct `/`→`-` conversion.
10. Diff the actual override API (custom properties declared on `:host`) against the plan's token table — flag excess exposure (beyond 5–7), missing documented tokens, or locked tokens leaking through.
11. Check for concerns the plan flagged as parent-owned — flag duplication.
12. Diff style blocks against the PRD's Variants & States table — flag any missing variant/state.
13. If motion is present, verify token-based durations/easing and a `prefers-reduced-motion` override; flag hardcoded values, missing override, or animation exceeding 300ms without design justification.
14. Scan for physical CSS properties that should be logical (`margin-left` → `margin-inline-start`, etc.), per the project's `css-styling` skill if installed.
15. Compile findings with severity: CRIT (raw hex/palette token used, `::ng-deep` present, or unjustified `ViewEncapsulation.None`), HIGH (missing variant/state coverage, override API exceeds bounds or leaks locked tokens), MED (parent-ownership duplication, logical-CSS gaps), LOW (polish/consistency).

**Acceptance check:** decisions/narrative docs read and cited where relevant; zero raw hex/palette-token usage; `:host` confirmed as sole styling root; zero `::ng-deep`; every `ViewEncapsulation.None` justified and host-class-scoped; sampled tokens verified against Figma mapping; override API diffed against the plan's token table; no parent-owned duplication; every PRD variant/state styled; motion (if present) token-based with reduced-motion override; logical CSS checked; each finding tagged CRIT/HIGH/MED/LOW with `file.scss:line`, ≤12-word description, ≤8-word fix hint.

## After reviews return

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
- Larger changes → redo the relevant scaffolding step (Angular class, styles, Storybook, or tests) using the process from `ds-scaffold`

### Update progress tracking

For each step file in `planDir`, tick off acceptance checks based on review findings:
- Confirmed → `- [x]`
- Flagged → `- [!] {brief note}`
- Not applicable → leave `- [ ]`

Set `Status` at top of each step file:
- All `[x]` → `Status: completed`
- Any `[!]` → `Status: needs-fix`

Step file → review mapping:
- `step-*-types-api*`, `step-*-component-class*`, `step-*-template*` → Code review
- `step-*-styles*` → Styles review
- `step-*-a11y*` → A11y review
- `step-*-tests*` → confirmed by the test suite passing
- `step-*-storybook*` → confirmed by Storybook building/running

Update `docs/prd.md` acceptance criteria: tick `- [ ]` → `- [x]` for each confirmed criterion, or `- [!]` if flagged.

Update `progress.md` — mark ✅ `completed` or ⚠️ `needs-fix` for each step row.

## Write handoff

Update `{componentPath}docs/session-handoff.md` — mark Phase 6 complete, note any issues fixed.

Print:

```
Review complete.

Before continuing, drop the raw review-finding narration and fix-by-fix diff commentary from working context — fully captured in review-issues.md, progress.md, and the updated step files already. Keep: componentPath, phase-state.json values, planDir.

Then run the ds-ship skill for <name> next.
```
