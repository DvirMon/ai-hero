---
name: skill-hub-generator
description: Generates a new framework or language developer Skill Hub (SKILL.md + reference file plan) — e.g. for Node.js, .NET, Vue, Go, or any ecosystem not yet covered. Use whenever the user asks to build, create, or draft a "skill hub", "developer skill", or "SKILL.md" for a specific framework/language, or says things like "make me a skill for X like I have for React/Angular". Do NOT use this for editing/improving an existing skill's triggering or running evals — use skill-creator for that instead. This skill only covers Steps 1-5: research → topic list → reference file plan → agnostic-hub linkage → thin SKILL.md router. It stops before writing reference file content.
license: MIT
metadata:
  author: Dvir Monajem
  version: '1.0'
---

# Skill Hub Generator

Generates a new **framework/language developer Skill Hub**, following the
same process used to build `react-developer` from `angular-dev-v19`. This
skill produces a **plan**, not full content: a thin `SKILL.md` router plus a
reference-file plan. Actual reference file content is a separate, later pass
— only proceed to writing reference files once the user explicitly approves
the plan from this skill.

## Core principle

Every topic in the resulting hub must be independently justifiable as
**current, real practice in the target ecosystem** — never derived by
mapping another framework's category list onto this one, even "just to
check for gaps." If the user already has sibling hubs (React, Angular,
Node.js), do not open or reference them during topic derivation. Comparison
across hubs is a bias, not a QA step.

## Process

### Step 1 — Scope
Confirm with the user (ask if not already stated):
- Target framework/language and version (pin it; flag experimental features)
- Greenfield or legacy project
- Runtime context (client-side SPA, server backend, CLI tool, library, etc.)

### Step 2 — Native Research (REQUIRED, every time — never skip)
Web-search current professional practice and ecosystem consensus for the
target framework/language:
- What separates junior from senior work in this ecosystem today
- Current idiomatic patterns and any recent breaking/idiomatic shifts (new
  APIs, deprecated APIs, compiler/tooling changes)
- Common anti-patterns the model tends to default to from training data
  (older syntax, deprecated APIs, patterns superseded by newer versions)

Do this research even if you feel confident about the ecosystem already —
training data goes stale on "current state" facts (latest version, current
idiomatic default) even when underlying concepts don't.

### Step 3 — Native Topic List
Produce 8-14 high-level categories covering the real professional-competency
surface of the target ecosystem. For each, state briefly why it matters
based on Step 2's research — not by analogy to another framework.

### Step 4 — Reference File Plan
Break each category into individual reference files, one topic per file, at
the granularity of official docs or well-known style guides (not one giant
file per category). Include, within the appropriate category:
- A **Forbidden Generation Patterns** file — outdated idioms the model
  defaults to from habit, framed as a **generation guardrail** if the
  project is greenfield (not a migration protocol). Only add a migration/
  refactor protocol section if the project is explicitly legacy.

Present the full plan — category → filename → one-line description — for
the user's review. Do not write any reference file content yet.

### Step 5 — Agnostic Architecture Hub Linkage
Identify which planned topics are actually ecosystem-specific expressions of
universal engineering principles (SRP, pure functions, composability,
coupling/cohesion, dependency direction, testability, naming). For those:
- Do not duplicate the universal principle inside this new hub.
- Point instead to an agnostic hub: `frontend-architecture` for UI
  frameworks, `backend-architecture` for server/backend ecosystems, or
  propose a new agnostic hub name if neither domain fits.
- The new hub's reference file should contain only the ecosystem-specific
  "how" (the idiom), with an explicit pointer to the agnostic hub's file for
  the underlying "why".
- If the relevant agnostic hub doesn't exist yet, flag this to the user and
  offer to draft its topic list the same way (Steps 2-4) before continuing.

### Step 6 — Write the SKILL.md Router
Write **only** SKILL.md, as a thin router:
- Frontmatter: `name`, `description` (with trigger phrases, written a bit
  "pushy" per skill-authoring convention so it reliably triggers), `license`,
  `metadata` (author, version, scope/target)
- A scope note: greenfield/legacy, runtime context, version pinning, and
  what's explicitly out of scope
- One line + link per planned reference file, grouped under the Step 3
  category headers
- No inlined tables, code samples, or paragraph-length explanations — all
  depth belongs in the reference files, written later

Stop here. Do not generate reference file contents until the user reviews
and approves both the plan (Step 4) and the router (Step 6).

## Notes

- This mirrors the format convention of existing hubs (`react-developer`,
  `angular-dev-v19`) — thin `SKILL.md` + `references/<topic>.md` — but never
  their topic taxonomy. Structure is reusable; content categories are not.
- If the user says "just vibe, skip the research," confirm they understand
  the resulting hub may bake in stale or non-idiomatic patterns, since that
  is the one step this skill treats as non-negotiable by default.
