---
name: ds-spec
description: Phase 3 of DS component creation — generates PRD, a11y spec, and architecture doc from interview decisions. Run after ds-interview, after the phase-end context trim.
portedFrom: 4e6a784e311c
---

# DS Component Builder — Phase 3: Spec

There is no subagent dispatch mechanism here — the Claude Code version runs the PRD writer, a11y speccer, and (when complex) the architect in parallel as separate subagents. Do the three write-ups **yourself, in this same session, one after another** in the order below. Each section's substance (inputs, responsibilities, process, acceptance criteria) is folded in below.

## Config Setup

Discover `{projectPath}/.claude/ds-wayfinder.config.json` (walk up from component path):
- Output structure (docs dir, spec file, roles-map file)
- Framework (determines code examples in spec)

Read spec template: `~/.cursor/skills/ds-spec/references/prd.md`

---

## On start

Ask the user for the component name, then read `{componentPath}docs/session-handoff.md`.

If the "Design Interview" checklist item is not marked complete → tell the user to finish `ds-interview` first.

Read `{componentPath}docs/phase-state.json` — load `isComplex`, `scopeTriage`, and `discoverySummaryPath`.
Treat `discoverySummaryPath` as a path stored **relative to `{componentPath}`** (for example, `"docs/discovery-summary.md"`), not relative to the repo root.
Note: `componentPath` always ends with `/` (e.g. `libs/shared/ui-core/src/lib/components/2.0/atera-button/`), so `{componentPath}{discoverySummaryPath}` is always a valid joined path.
Read `{componentPath}docs/decisions.md` — load its **full content**.
Read the discovery summary from `{componentPath}{discoverySummaryPath}`.

## Pre-write: Prototype check

Before writing, scan `decisions.md` for async/timing/state-machine complexity:
- Are there decision sections describing async flows, loading states, or complex state transitions?
- Do any decisions mention "order of operations", "race conditions", or "unclear timing"?

If yes, offer: *"Your state/async logic looks complex. Should I prototype a minimal reducer or state-machine scaffold to validate the sequence before locking the spec?"*

If yes:
1. Create throwaway branch `prototype/logic-{component-name}`
2. Build a minimal, disposable prototype addressing the async/state challenge, using the design-decisions context
3. Review: Does the logic flow match expectations? Any race conditions exposed?
4. Update `decisions.md` with learnings (e.g., "Async order confirmed via prototype: fetch → error check → state update")
5. Delete the prototype branch
6. Proceed to writing below

## Write 1 — PRD (always)

**Purpose:** Generate `docs/prd.md` — the authoritative planning document for the component: what it is, why it exists, its versioned scope, its public API, and its acceptance criteria. Every subsequent phase (task planning, scaffolding, review) treats this file as ground truth.

**Inputs:** componentName, componentPath, discoverySummary (full file content), designDecisions (full content of `decisions.md`).

**Process:**
1. Read `discoverySummary` in full — extract Figma variants/states, tokens, `internalDsComponents`, primitive decision, and any "No Figma available" fallback note.
2. Read `designDecisions` in full — extract API decisions (inputs/outputs/slots), scope triage by version, and the Accessibility Contract decisions.
3. Write "What" and "Why" — specific to this component, no generic filler.
4. Build the Scope section: one subsection per version bucket that has assigned features; omit V3/V4 sections entirely if empty.
5. Populate Component Overview: selector `{prefix}-<name>`, location under `{dsComponentsRoot}`, primitive name from discovery, complexity level from design decisions.
6. Copy `internalDsComponents` rows verbatim from discovery, including exact import paths — write "none" if the list was empty.
7. Populate Variants & States tables from Figma analysis, cross-checked against the final API decided in interview.
8. Populate API Summary (Inputs/Outputs/Content slots tables) from `designDecisions` — this is the authoritative source, not discovery.
9. Write the Accessibility summary table at PRD level (role, keyboard contract summary, focus on open/close) — reference that the full spec lives in the a11y spec (written next, below).
10. Write Acceptance Criteria: Figma variants implemented, states correct, keyboard operable, ARIA correct, role tokens only, theme element class present, internal DS components used not reimplemented, public API exported, Code Connect published — plus any component-specific criteria from discovery/decisions.
11. Include User Stories only if more than one distinct interaction pattern exists.
12. Write `docs/prd.md` to `componentPath`, following the template in `~/.cursor/skills/ds-spec/references/prd.md`: What, Why, Scope (by version bucket), User Stories (optional), Component Overview, Internal DS Components, Variants & States, API Summary, Accessibility summary, Acceptance Criteria.

**Acceptance check:** What/Why specific, not generic; Scope pulled verbatim from `designDecisions`' scope triage, empty version sections omitted; Internal DS Components table matches discovery exactly (exact import paths, "none" if empty); API Summary sourced from `designDecisions`, not re-derived from discovery alone; Accessibility summary consistent with the a11y spec being written next (same role, same high-level keyboard contract); Acceptance Criteria checkable; User Stories only if warranted.

## Write 2 — A11y spec (always)

**Purpose:** Write the component's accessibility spec by combining Phase 1's a11y discovery (Pass 4 in `ds-discovery`) with the user's design decisions from interview (Phase 2). Dispose and formalize what discovery surfaced and interview decided — don't re-discovery patterns or re-fetch APG/WCAG pages. Non-complex: inline spec text. Complex: `docs/roles-map.md` matrix.

**Inputs:** componentName, componentPath, discoverySummary (must include the "A11y Patterns" section — matched APG pattern(s)/source URLs, applicable WCAG SCs, semantic HTML recommendation, keyboard/focus/SR/touch-target pattern options), designDecisions (must include the "Accessibility Contract" decisions from interview), isComplex.

If `discoverySummary` lacks an "A11y Patterns" section, stop and flag it rather than doing discovery from scratch.

**Process:**
1. Read `discoverySummary`'s "A11y Patterns" section — extract matched APG pattern(s)/source URLs, applicable WCAG SCs, semantic HTML recommendation, keyboard/focus/SR/touch-target pattern options.
2. Read `designDecisions`'s "Accessibility Contract" decisions — extract the chosen semantic approach, focus trap need, WCAG AA/AAA target, touch target size, keyboard nav strategy.
3. Resolve semantic HTML element using discovery recommendation + interview decision (interview wins if they conflict — flag the conflict).
4. Write ARIA roles/states/attributes directly from the discovered APG citation — don't invent, don't re-fetch.
5. Resolve the keyboard map: take the pattern options discovery surfaced, apply the strategy interview decided.
6. Specify focus contract (initial, trap y/n, restoration, indicator) per interview decision.
7. Script screen reader announcement text for name/role/state/changes, per discovered pattern + interview confirmation.
8. Write visual design notes (contrast/focus/touch-target/motion) per interview's WCAG level and touch-target decisions.
9. Dispose every WCAG SC from the discovery output's applicable list — Applies (how) or N/A (reason). Zero skipped rows. Do not re-derive the SC list yourself — take it from `discoverySummary`.
10. Write output: inline block if `!isComplex`, else `docs/roles-map.md`, including the filled-in SC traceability table. For composite/non-APG components (per discovery), label the output as composed and list each sub-pattern's source URL separately.

**Output format (non-complex, inline):**

```markdown
# A11y Spec: atera-{name}

## Semantic Structure
- HTML element: `<{element}>`
- ARIA role (if not semantic): `role="{role}"`

## States
| State | ARIA Attribute | Value |
|---|---|---|
| active/selected | aria-selected | true \| false |

## Keyboard Interaction
| Key | Action | Notes |
|---|---|---|
| Tab | Move focus to next | Standard browser |
| Enter | Activate | {description} |

## Focus Management
- Initial focus: {description}
- Focus trap: {yes/no}
- Focus indicator: {description of visual}

## Screen Reader
- Component name announced as: {description}
- State announced as: {description}

## Visual Design for A11y
- Color contrast (text): {ratio} (WCAG AA: 4.5:1, or AAA per decision)
- Touch targets: {size or exception, per decision}
- Motion: {none/yes with reduced-motion variant}

## WCAG Success Criteria Traceability
| SC | Title | Disposition | How addressed / reason N/A |
|---|---|---|---|
| 1.1.1 | Non-text Content | Applies \| N/A | {...} |
| ... | ... | ... | {one row per SC from discovery's applicable list — no omissions} |

## References
- ARIA Pattern: {source URL cited by the Phase 1 a11y discovery}
- HTML Element: https://html.spec.whatwg.org/...
```

This spec describes markup semantics only — never framework APIs (no Angular/React/Vue-specific mechanisms). That translation belongs to the scaffold phase.

**Acceptance check:** semantic element resolved with conflicts flagged; every ARIA role/attribute traced to the discovered APG source; composite/non-APG components labeled as composed with each sub-pattern's source; keyboard map resolved from discovery + interview; focus contract fully defined; SR announcements scripted; contrast/touch-target/motion specified per interview decisions; every applicable SC disposed, zero blank rows; output format matches `isComplex` routing.

## Write 3 — Architecture doc (only if `isComplex = true`)

**Purpose:** Generate `docs/architecture.md` for components complex enough to need one before implementation: overlay/portal usage, trigger+panel structure, 3+ state machines, complex focus management, or multiple coordinated child components. The component pattern and state machine decided here must be locked before scaffolding — changing pattern mid-implementation is costly. If `isComplex = false`, skip this write entirely.

**Inputs:** componentName, componentPath, discoverySummary (primitive decision, Figma analysis, internal DS components), designDecisions (API surface, interaction behavior, scope triage).

**Process:**
1. Read `discoverySummary` — extract the finalized primitive decision (CDK primitive, ng-primitives primitive, or hand-rolled) and any internal wrapper override noted by the codebase discovery pass.
2. Read `designDecisions` — extract interaction behavior, API surface, and any explicit architecture-relevant decisions from interview.
3. Decide component pattern (single / two-part trigger+panel / multi-component) — justify against a reference-library equivalent if one exists, referencing the adaptation table in the framework primitives reference.
4. Draw the hierarchy tree naming each unit (`<Name>Container`, `<Name>Panel`, `<Name>Trigger`, repeated items) using `{prefix}-<name>` naming conventions.
5. Fill the Primitive Wiring table with concrete primitive names/imports per concern, sourced from discovery — do not re-discovery or substitute a different primitive here.
6. Enumerate every state variable with its representation and every transition (including guard rules like "cannot open when disabled").
7. Write Data Flow sequences for each significant user action (open, navigate, select/confirm, dismiss) from trigger to final emitted event.
8. List Open Questions — anything genuinely unresolved (e.g. panel width strategy, behavior inside scroll containers) that blocks confident scaffolding.
9. Write `docs/architecture.md` to `componentPath`, following the template at `~/.cursor/skills/ds-wayfinder/references/architecture.md` (+ `.{framework}.md`): Component Pattern (with justification), Component Hierarchy, Primitive Wiring, State Management (states + transition rules), Data Flow, Open Questions.

**Acceptance check:** pattern decided and justified, not "TBD"; hierarchy tree uses `{prefix}-<name>` conventions; Primitive Wiring sourced from discovery, not re-discovered; State Management complete including error/edge states; Data Flow traces at least one sequence per significant action; Open Questions lists every genuinely unresolved decision; only written because `isComplex = true`.

## After writing

Present the generated docs to the user with their file paths:
- `docs/prd.md` (always)
- `docs/roles-map.md` (if `isComplex = true` — for non-complex components the a11y spec is inline, not a file)
- `docs/architecture.md` (if `isComplex = true`)

## Developer checkpoint

If `isComplex = false`, print the inline a11y spec here so the user can review it before approving:

```
**A11y spec (inline):**
{a11ySpecText from Write 2}
```

> "Please review the spec files above and confirm before I generate the implementation plan."

Wait for explicit approval before continuing.

## Write handoff

Merge a11y spec data into `{componentPath}docs/phase-state.json` (preserve all existing keys):

- If `isComplex = false`: set `a11ySpecText` to the full inline spec, set `a11ySpecPath` to `null`
- If `isComplex = true`: set `a11ySpecPath` to `"docs/roles-map.md"` and set `a11ySpecText` to `null`

`docs/phase-state.json` is the source of truth for downstream phases for both `a11ySpecText` and `a11ySpecPath`.

Update `{componentPath}docs/session-handoff.md` — mark the "Spec" checklist item complete and update "What to do next", but do **not** persist the a11y spec there or instruct downstream phases to read `a11ySpecText` from the handoff.

Print:

```
Spec complete.

Before continuing, drop the PRD/a11y/architecture raw generation output and any prototype exploration from working context — fully written to those docs already. Keep: componentPath, phase-state.json values (isComplex, a11ySpecText/a11ySpecPath), paths to prd.md, roles-map.md, architecture.md.

Then run the ds-plan skill for <name> next.
```
