---
name: domain-focused-wayfinder-hubs
status: opt-in / project-dependent
---

> Not auto-loaded. A structural/organizational choice, not a universal rule — fits projects with
> multiple substantial domains (server, feature, design-system, ...) worth separating into their
> own decision-tracking hubs. Skip for small projects or single-domain work.

# Architecture: Domain-Focused Wayfinder Hubs

**Pattern**: Research → Grill → Wayfinder Map → Execute

Each domain (e.g. server, feature, design-system) gets its own `wayfinder` instance that:
1. Research phase clears fog (codebase, online patterns)
2. Grilling phase clarifies decisions needed
3. Creates a wayfinder map tracking decisions as tickets
4. Works through tickets to resolve fog
5. Executes once decisions are locked

### Shared skills (domain-agnostic)

Referenced by every hub: `grilling` (clarify requirements/decisions), `domain-modeling` (pin
down domain concepts), `to-spec` (convert decisions into specs), `to-tasks`/`to-ticket` (create
task tickets).

### Domain-specific skills

Each hub also pulls in whatever's specific to its domain — e.g. a design-system hub pulls
Figma/design-research skills, a feature hub pulls the relevant frontend developer skill, a
server hub pulls the relevant backend developer skill and infra research.

### Coordination

Hubs work in parallel but track cross-hub dependencies at the initiative level (e.g. "feature hub
blocked waiting on server hub's API spec").

**Why:** each domain has different research, tools, and decision logic. Shared skills handle the
cross-cutting workflow pattern; each hub stays focused on its own domain. Reduces coupling and
keeps the tracked decision surface per-domain instead of one undifferentiated backlog.
