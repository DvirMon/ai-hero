# ds-wayfinder Skill Review — Handoff

## PR Scope

This PR splits the original monolithic `ds-wayfinder` orchestrator into 7 specialized micro-skills (`ds-discovery`, `ds-interview`, `ds-spec`, `ds-plan`, `ds-scaffold`, `ds-review`, `ds-ship`). The hub skill (`ds-wayfinder/SKILL.md`) is refactored into a routing table. This is a full architectural decomposition — not a minor addition of prerequisites, artifacts, or handoff clarification. Reviewers should evaluate the new skill boundaries, session-break protocol removal, and per-phase entry/exit contracts.

## Architecture change (2026-05-09)

The monolithic orchestrator was split into 7 per-phase sibling skills. Each phase is now a standalone skill the user invokes in a new session. The session-break protocol and entry guards are gone — replaced by the natural session boundary of user-invoked skills.

**Hub skill:**
- [x] `ds-wayfinder/SKILL.md` — refactored to routing table (30 lines); lists all 7 phase skills and shared references

**Phase skills (new):**
- [x] `ds-discovery/SKILL.md` — Phase 1: setup, ng-primitives check, 3 parallel agents, dedup gate, handoff
- [x] `ds-interview/SKILL.md` — Phase 2: grill-me core (relentless, one-at-a-time, walk decision tree); designer vocabulary as translation layer only
- [x] `ds-spec/SKILL.md` — Phase 3: PRD + a11y + architect agents, developer checkpoint
- [x] `ds-plan/SKILL.md` — Phase 4: task planner agent, versioned plan folders, developer checkpoint
- [x] `ds-scaffold/SKILL.md` — Phase 5: 4 parallel scaffolders, progress tracking
- [x] `ds-review/SKILL.md` — Phase 6: 3 parallel reviewers, inline fixes, step file + progress updates
- [x] `ds-ship/SKILL.md` — Phase 7: export, Code Connect reminder, final checklist

**Shared references (unchanged, still in `ds-wayfinder/references/`):**
- [x] `session-handoff-template.md` — unchanged
- [x] `design-interview-subjects.md` — unchanged (used by Phase 2)
- [x] `component-api.md` — unchanged (used by Phase 2)
- [x] `accessibility.md` — unchanged (used by Phases 2, 3)
- [x] `architecture.md` — unchanged (used by Phases 2, 3)
- [x] `prd.md` — unchanged (used by Phase 3)
- [x] `styles.md` — unchanged (used by Phase 5)
- [x] `unit-testing.md` — unchanged (used by Phase 5)
- [x] `cdk-primitives.md` — unchanged (used by Phase 1)
- [x] `file-structure.md` — unchanged (used by Phases 4, 5)
- [x] `tasks.md` — DS-specific step content and acceptance criteria templates; actively used by `ds-task-planner` agent as authoritative content source per-step

## REVIEW COMPLETE
