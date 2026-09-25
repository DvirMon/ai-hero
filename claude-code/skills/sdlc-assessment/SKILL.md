---
name: sdlc-assessment
description: Assess a repository's AI-assisted delivery system against a framework-neutral target architecture (GE-01..GE-30) — workflow topology, durable state, idempotency, artifact lineage, agent authority, verification gates, evals, observability. Read-only audit producing one Markdown report plus a dependency-aware migration plan. Use when the user asks to assess/audit an SDLC, agent pipeline, or delivery control plane; to check whether a repo's automation is governable/auditable/resumable; or names "graph engineering", GE-xx capabilities, or agent authority analysis.
disable-model-invocation: true
---

# SDLC assessment

Evidence-based conformance audit of a repository's **delivery system** — not its product code —
against the target architecture in [reference-architecture.md](references/reference-architecture.md).

Output: one Markdown report at a caller-chosen path, plus a short pointer in chat. Per
[route-discovery-to-agent.md](../../rules/route-discovery-to-agent.md), findings go to the file;
chat never gets the tables.

## Vendor neutrality

The reference architecture names LangGraph, Claude Code, GitHub, Temporal and MCP as **examples**.
None is required. Assess capabilities first, implementation choices second. A repo satisfying GE-13
with GitLab approval rules satisfies it as fully as one using GitHub Environments.

This skill's `references/` are plain Markdown with no Claude-specific syntax — they are portable to
Gemini, Cursor, Copilot or any other harness, and are mirrored to the guidelines knowledge base by
the `sync-guidelines` skill.

## The two non-negotiables

Everything else in the procedure serves these:

1. **Evidence before conclusions.** Every claim about current state cites a path, line range,
   symbol, workflow job, config key or command. Unprovable → label it an inference or
   `NOT_VERIFIABLE`. "I did not find it" is never "it does not exist" — SaaS controls (branch
   protection, environment gates, token scopes) live outside the repo.
2. **Guidance is not enforcement.** A `CLAUDE.md`, `AGENTS.md`, rule, skill or system prompt never
   makes a hard requirement `SATISFIED`. Find the mechanism: permission, sandbox, hook, CI check,
   ruleset, environment gate, secret boundary, policy engine, runtime validator.

## Inputs

- **target** (required) — repo/workspace root to assess. Confirm it; never assume cwd silently.
- **outputPath** (optional) — defaults to `docs/assessment/sdlc-assessment.md` under the target.
- **depth** (optional, default `standard`) — `quick` (inventory + authority matrix + GE matrix,
  no target-state design) or `standard` (all 19 report sections).
- **externalEvidence** (optional) — anything the user can supply about platform settings the repo
  cannot show: branch ruleset export, required checks, environment protection, bot token scopes.

## Process

1. **Confirm scope.** Target repo, output path, depth. In a multi-context repo (root `llms.txt`,
   `CONTEXT-MAP.md`, or a workspace project list), ask whether the audit covers the whole
   workspace or one context — the delivery system is usually repo-wide even when the code is not.

2. **Ask for external evidence once, up front.** List exactly what cannot be read from disk and let
   the user paste it or decline. Declined → those capabilities are `NOT_VERIFIABLE` with the
   evidence request named. Do not guess, and do not re-ask later.

3. **Dispatch the `sdlc-assessor` agent** with `target`, `outputPath`, `depth`, `externalEvidence`.
   It is read-only and writes exactly one artifact: the report. Two or more independent targets →
   one agent each, in parallel.

4. **Relay the pointer.** Report path, the count of P0/P1 findings, and the single highest-impact
   gap in one line each. Never paste the matrices into chat.

5. **Stop.** The report is a proposal. Per
   [plans-execute-in-separate-session.md](../../rules/plans-execute-in-separate-session.md),
   acceptance is the user's, and execution is a separate session. Offer nothing and start nothing.

## What this skill does not do

- **No fixing as you go.** The audit never edits the repo it assesses — including obvious
  one-liners. Read-only is what makes the current-state model trustworthy.
- **No invented practices.** The reference architecture is the target. A repo-specific
  recommendation outside it is allowed, but must be labelled an additional recommendation and tied
  to a concrete problem found in that repo.
- **No maturity score.** No percentage, no traffic light, no "level 3 of 5".
- **No framework recommendation by default.** Section 19 of the report — the "Do Not Build" list —
  is mandatory and exists specifically to counter overengineering. A new dependency is justified
  only by naming the capability it solves and why configuring, extending or adding a small control
  cannot.

## References

| File | Use |
|---|---|
| [reference-architecture.md](references/reference-architecture.md) | Target state. Capability definitions GE-01..GE-30, control-plane model, anti-pattern catalog, priority model, source register. |
| [assessment-procedure.md](references/assessment-procedure.md) | Audit procedure. Discovery steps, the architectural questions to answer, quality bar, final decision rule. |
| [capability-matrix.md](references/capability-matrix.md) | Fillable GE-01..GE-30 worksheet — one row per capability, required fields, status vocabulary. |
| [report-template.md](references/report-template.md) | The 19 report sections in fixed order. |

## Final decision rule

For every proposed change, the report must answer:

> What concrete failure, missing capability, risk or manual bottleneck **in this repository** does
> this solve, and why is this the simplest reliable mechanism that solves it?

No evidenced answer → the recommendation does not go in.
