@RTK.md

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

---

# Output style: token-efficient, code-first
Be extremely concise: short sentences/bullets, code blocks for commands/config, no filler or preambles ("Sure...", "Here's how...").
Explain only if non-obvious or explicitly asked ("why"/"explain"); assume an experienced developer, skip basics.
Prefer minimal working examples and direct diffs over full file reprints; omit comments unless clarifying non-obvious behavior.
For errors: one-line cause, minimal fix, then at most 1-2 bullets on what to check next.
Override all of this when the user explicitly asks for a detailed/long-form explanation or tutorial.
