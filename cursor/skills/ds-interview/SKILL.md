---
name: ds-interview
description: Interview phase — grills the component's design/API/accessibility/edge-case surface until nothing is ambiguous, one question at a time, logging decisions as they crystallize. Phase 2 of DS component creation.
portedFrom: 85a657f6d76a
---

# DS Component Builder — Phase 2: Design Interview

## Config Setup

Discover `{projectPath}/.claude/ds-wayfinder.config.json` (walk up from component path):
- Framework (determines which component API reference to use)

Read framework-specific reference: `~/.cursor/skills/ds-interview/references/component-api.{framework}.md`

A11y grilling patterns come from `discovery-summary.md`'s "A11y Patterns" section (the a11y discovery written during Phase 1, live-fetched, component-specific) — not a static reference file.

---

## Goal

Remove ambiguity from the component's design before spec and scaffold. Interview the user one question at a time — not a form to fill in bulk. Ask only about what's still unresolved after discovery; never re-ask or restate what `discovery-summary.md` already answered.

## On start

1. Ask for the component name if not provided as an argument.
2. Read `{componentPath}docs/session-handoff.md` and `{componentPath}docs/discovery-summary.md`.
3. Read reference docs — they ground the interview, **not** a question script:
   → `~/.cursor/skills/ds-interview/references/component-api.md` (agnostic — principle, pattern tree, mapping)
   → `~/.cursor/skills/ds-interview/references/component-api.{framework}.md` (framework from config — concrete syntax only)
   → `~/.cursor/skills/ds-wayfinder/references/architecture.md` (shared, agnostic)
   → `~/.cursor/skills/ds-wayfinder/references/architecture.{framework}.md` (shared, concrete syntax)

A11y grounding comes from `discovery-summary.md`'s "A11y Patterns" section — already read in step 2 above.

## Step 1 — Work-type classification

Read `workType` from `{componentPath}docs/phase-state.json` — already collected in `ds-discovery` Setup. Don't re-ask.

### `workType: tokens` fast path

If `workType` is `tokens`, skip Step 2's grill entirely. There is no new API/a11y/edge-case surface to interview — `discovery-summary.md` already holds the full token diff. Write `{componentPath}docs/decisions.md` directly from that diff (format per Step 3 below), covering only: work type (`tokens`), the token names/values changing, and a one-line confirmation that no API/behavior surface changes. Skip to **Handoff** (end of file).

### Otherwise

Proceed to Step 2 with the `workType` already known — use it to scope the grill (e.g. `variant`/`modify` narrow questions to the changed surface; `new` runs the full grill below), but don't ask the user to reclassify it.

## Step 2 — Grill the design

If the component has more than one sub-part (variants that behave differently, composed
sub-components, multiple independent states), apply `decompose-by-dependency-graph` before
grilling: list the sub-parts, map dependency edges between them, rank core/independent/dependent.
This ranking is `scopeTriage` (written in Step 3) — grill core and independent sub-parts fully
now; dependent ones only after their upstream settles.

This is the core of the phase. Run the composability decision tree from `component-api.md` first — it resolves a lot mechanically — then grill whatever it leaves open.

**Prototype trigger — detect and offer:**
During grilling, watch for signals that a decision is uncertain or UX/async timing needs validation:
- **UX signals:** "How should X render?" / "Does this layout work?" / "Will consumers find this confusing?" / "What about edge-case rendering?"
- **Async/timing signals:** "What's the order of operations?" / "Can these race?" / "When does X update relative to Y?" / "What if the async call fails mid-flow?"

When you hit either signal, offer: *"This UX/timing is tricky to visualize in text. Want me to build a quick UI stub / state-machine sketch on a throwaway branch to validate it?"*

If yes:
1. Create throwaway branch `prototype/component-{question-area}`
2. Build a small, disposable prototype addressing the specific question and constraints — real code or a minimal sketch, whichever answers the question fastest
3. Review with user: *"Does this match the behavior you want?"*
4. Record the validated decision in `decisions.md` — note that it was prototype-validated
5. Delete the prototype branch
6. Resume grilling from the next question

**Coverage guide — not a checklist.** These are areas that commonly hide ambiguity in a DS component. They're a reminder of where to look for fuzziness, not a quota: don't force a fixed number of questions per area, and don't ask about an area at all if discovery or the composability tree already settled it.

- **API surface & composability** — inputs/outputs, defaults, content projection/slots, what it wraps or extends
- **States & variants** — every state (hover/focus/disabled/error/loading/empty) and variant combination, especially interactions between them
- **Accessibility contract** — keyboard behavior, ARIA roles/attributes, focus management, screen-reader announcements
- **Edge cases & error states** — before moving on from this area, reason about the failure surface of *this specific component type*. Don't use a fixed list — a form field, a data table, an async uploader, and a media player each fail differently. Derive: what validation errors can occur? what async/loading failures exist? what state conflicts are possible (error + disabled, loading + required, etc.)? who owns clearing the error — the component, the parent, or the user? is the error transient or persistent? what does recovery look like? Pull each thread until nothing is left fuzzy.
- **Usage scenarios** — how consumers actually use it in context, not just its isolated API
- **Design-token / theming implications** — anything visual the discovery left as "pending Spec"
- **CVA / model binding** — yes/no, and what that implies for form integration

**Rules:**
1. Ask one question at a time. Prefer questions that expose an edge case, an unstated assumption, or a decision the discovery left implicit.
2. Keep going until you can't find another fuzzy edge — don't stop just because you've touched every area above, and don't pad with confirmatory questions once an area is genuinely settled.
3. The moment an answer settles something, append it to `{componentPath}docs/decisions.md` immediately (format below) — don't hold it in memory to reconstruct at the end.
4. If discovery or an existing DS sibling already answers an area unambiguously, skip it silently. Never ask the user to restate something the discovery summary already established — that's not grilling, it's busywork.
5. The goal is coverage of possible cases and removal of ambiguity — not a confirmation pass over what discovery already provided.

**Decision format** (append one block per settled decision):

```markdown
## Decision: <Subject>

**Chosen:** <what was decided>

**Why:** <reasoning from the answer + reference files>

**API surface:**
- `<input>: <type>` (default: `<default>`) — <description>

**Rejected alternatives:**
- <alt>: <why not>

**Constraints:**
- <constraint>
```

## Step 3 — Write handoff

Confirm `{componentPath}docs/decisions.md` covers, at minimum: work type, component direction, full API surface (all inputs/outputs/events), primitive layer, CVA usage, accessibility contract. Append anything still missing.

Merge into `{componentPath}docs/phase-state.json` (create if missing, preserve existing keys):
```json
{
  "interviewComplete": true,
  "workType": "<new|variant|modify|tokens>",
  "isComplex": <true|false>,
  "scopeTriage": [
    { "subPart": "<name>", "rank": "core|independent|dependent", "dependsOn": ["<subPart>", "..."] }
  ]
}
```

`scopeTriage` is the Step 2 dependency-graph ranking, one entry per sub-part. Omit the field
(or leave `[]`) if the component had no sub-parts to decompose. `ds-spec` and `ds-plan` read
this — it must reflect what was actually graphed, not be backfilled as an afterthought.

Update `{componentPath}docs/session-handoff.md` — mark "Design Interview" checklist item complete, update "What to do next".

Print:

```
Design interview complete.

Before continuing, drop the question-by-question grill transcript and any prototype-branch exploration detail from working context — fully captured as Decision blocks in decisions.md already. Keep: componentPath, phase-state.json values, path to decisions.md and discovery-summary.md.

Then run the ds-spec skill for <name> next.
```
