---
name: docs-by-responsibility
status: opt-in / project-dependent
---

> Not auto-loaded. Only `~/.claude/rules/*.md` is always-on globally — this file lives outside
> that dir on purpose. Pull it into a project's own `CLAUDE.md` (e.g. `@conventions/docs-by-responsibility.md`
> or paste inline) when that project's docs should follow domain colocation. Skip it for projects
> with an existing/different doc convention (e.g. a report-style repo with a central docs folder).

# Docs by Responsibility — Architectural Strategy

Code and docs are colocated by domain, not gathered centrally. A **domain** = the public API boundary (a component, feature, package, or app).

**Pattern:**
```
src/design-system/components/Button/
├── Button.tsx
├── Button.module.css
└── docs/
    ├── spec.md              ← implementation spec (from /to-spec skill)
    ├── narrative.md         ← design intent / why this domain exists
    └── decisions.md         ← local decisions, links to shared ADRs
```

**Rationale:** A domain owns everything needed to understand and implement it. No bouncing between central docs and code. Scales: as the codebase grows, you can find Button's spec by finding Button's code. Inner helpers are documented as part of the parent domain's spec.

**Key rules:**
- Each domain has its own `docs/` folder colocated with source
- `spec.md` + `narrative.md` + `decisions.md` live together
- Cross-domain decisions (glossary, architectural ADRs) stay centralized (`CONTEXT.md`, `docs/adr/`)
- Skills (`/grill-with-docs`, `/to-spec`) write outputs to domain folders, not central locations

See `docs/agents/skill-component-workflow.md` for how the workflow splits ticket bundles across domain folders.
