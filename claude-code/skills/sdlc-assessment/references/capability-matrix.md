# Capability worksheet — GE-01 … GE-30

Fillable companion to `reference-architecture.md` §29. One entry per capability. Definitions and
failure smells live in the reference architecture — do not restate them here; this file is the
shape of the answer.

## Status vocabulary

| Status | Meaning |
|---|---|
| `SATISFIED` | Evidence shows the capability exists **and is enforced** appropriately for its risk. |
| `PARTIAL` | Some capability exists; important enforcement, coverage or reliability is missing. |
| `MISSING` | Applicable, and no evidence of it. |
| `NOT_VERIFIABLE` | Likely external to the repo, or access insufficient. Name the evidence needed. |
| `NOT_APPLICABLE` | Does not apply. Explain why — an unexplained N/A is a skipped capability. |

`NOT_VERIFIABLE` is the correct status for SaaS controls that leave no repo trace: branch rulesets,
required status checks, code-owner enforcement, bypass lists, environment protection rules,
required reviewers, self-review policy, bot token scopes, secret scoping. Never downgrade one of
these to `MISSING` because the repo is silent about it.

## Required fields per capability

| Field | Content |
|---|---|
| ID | GE-xx |
| Capability | Short name |
| Applicability | Why it applies, or why not |
| Status | From the vocabulary above |
| Current implementation | Concise factual description |
| Evidence | Exact paths, line ranges, symbols, job names, config keys, commands |
| Gap | What is missing |
| Consequence | Concrete reliability / security / operability effect — not a restated gap |
| Recommended change | Project-specific, naming the mechanism |
| Reuse vs new | Which existing mechanism can carry it |
| Affected areas | Exact files, components, platform settings |
| Dependency | Prerequisite changes |
| Priority | P0 / P1 / P2 / P3 (reference architecture §31) |
| Validation | How to prove remediation works |

Generic recommendations ("add observability", "improve CI", "use better prompts") fail the quality
bar. State what to instrument, where, and what success evidence should exist.

## Capability index

Grouped for working order, not by importance. Full normative text in the reference architecture.

**Topology and contracts** — GE-01 explicit workflow topology · GE-02 bounded node
responsibilities · GE-03 explicit transition/guard logic · GE-30 complexity justification

**State and recovery** — GE-04 durable workflow state · GE-05 idempotent/recoverable side
effects · GE-18 bounded retries and loop termination · GE-27 cancellation/terminal states ·
GE-28 rollback/recovery path

**Artifacts** — GE-06 persistent artifact chain and lineage · GE-07 canonical source-of-truth
policy

**Authority** — GE-08 behavioral context separated from hard policy · GE-09 least-privilege
agent identity · GE-10 tool/action allowlisting · GE-14 separation of duties · GE-25 untrusted-input
handling · GE-26 transitive authority

**Gates and verification** — GE-11 independent verification · GE-12 required deterministic
checks · GE-13 human/risk gate · GE-15 protected integration path · GE-16 environment-specific
deployment boundary · GE-17 supply-chain evidence · GE-19 parallelism safety

**Agent configuration** — GE-20 agent-config versioning · GE-21 agent regression evaluation

**Observability and feedback** — GE-22 graph observability · GE-23 audit evidence ·
GE-24 production feedback loop · GE-29 data/telemetry governance

## Two traps

**Prompt counted as enforcement.** The most common false `SATISFIED`. A rule file saying "never
push to main" is GE-08 evidence *against* the repo, not for it, unless a ruleset or hook actually
blocks the push. Same for "the agent is told to run tests" versus a required status check (GE-12,
anti-pattern AP-10).

**Retry without idempotency scored as reliability.** A loop that can re-run a side-effecting node
is a defect until deduplication or a stable idempotency key exists (GE-05). Ten duplicate PRs, ten
duplicate review comments, ten deployments — score it as a defect, not a feature.
