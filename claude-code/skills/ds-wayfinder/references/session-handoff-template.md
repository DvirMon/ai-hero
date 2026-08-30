# {ComponentName} DS Component — Session Handoff

> `{componentPath}` = this component's own working directory, resolved from the project's `ds-wayfinder.config.json` (`designSystem.path` + `componentPathPattern` + `{prefix}-{name}/`).
>
> **How to use this template:** When a DS component session is interrupted before completion, fill this file and save it to `{componentPath}docs/session-handoff.md` (e.g. `libs/shared/ui-core/src/lib/components/2.0/{prefix}-{name}/docs/session-handoff.md` for this repo's config). The next session reads this file to resume without re-running research.
>
> Phase data (isComplex, a11ySpecText, planDir, componentFilePath, etc.) is stored in `docs/phase-state.json` — not here.

---

## Status

> Delete the inapplicable path below after filling in User type.

### Dev path (7 phases)
- [ ] Phase 1 — Research
- [ ] Phase 2 — Design Interview
- [ ] Phase 3 — Spec (PRD + A11y + Architecture)
- [ ] Phase 4 — Task Plan
- [ ] Phase 5 — Scaffold
- [ ] Phase 6 — Review
- [ ] Phase 7 — Ship

### Designer path (designer-companion front-half → figma-ds back-half)
- [ ] Phase 0 — Classify (hub)
- [ ] Phase 1 — Minimal recon (`dc-recon-min`)
- [ ] Phase 2 — Gap (`dc-gap`) — first panel + path selection
- [ ] Phase 3 — Recon, full & scoped (`dc-recon`)
- [ ] Phase 4 — Concept Mock (`dc-concept`)
- [ ] Phase 5 — Design Interview (`dc-grill`)
- [ ] Phase 6 — Spec (`dc-specs`)
- [ ] Phase 7+ — Back-half: `figma-ds:plan → scaffold → complete-storybook → ship`

**Current phase:** _fill in_
**Figma URL:** _fill in, or "not yet provided"_
**User type:** Developer / Designer
**Component path:** `{componentPath}` (e.g. `libs/shared/ui-core/src/lib/components/2.0/{prefix}-{name}/` for this repo's config)

---

## What to do next

_One sentence: which phase to resume and what the first action is._
