# Report template

Fixed section order. Omit a section only when `depth: quick` excludes it (sections 8–12 and 16–17),
and say so in the executive summary rather than dropping it silently.

---

## 1. Executive summary

What the current architecture actually is. Whether explicit graph orchestration is warranted at
all. Existing strengths worth preserving. Highest-impact gaps. Recommended migration direction.

No maturity score, no percentage, no marketing framing.

## 2. Repository and delivery-system inventory

Languages, frameworks, build, test, CI/CD, deployment, current agent tooling, persistence,
observability, security controls — and an explicit list of controls that exist outside the repo and
were not visible.

## 3. Current-state lifecycle graph

Mermaid diagram of how work flows **today**, plus explanation. Only paths supported by evidence.
Distinguish agent nodes, deterministic nodes, human gates, loops, manual handoffs, external
systems. Mark unproven transitions `unverified external control` rather than drawing them solid.

## 4. Current agent authority graph

| Actor / identity | Read | Write | Tools | Secrets | Merge | Deploy | Can invoke other privileged actor? | Evidence |
|---|---|---|---|---|---|---|---|---|

Then transitive-authority findings as prose: if A cannot deploy but can instruct B, and B deploys
without an independent gate, A holds effective deployment authority. Say so plainly.

## 5. Evidence map

The most important files and configuration, and what each one proves. Short — this is the index a
reader uses to check the rest of the report, not a file listing.

## 6. GE-01 … GE-30 gap matrix

Every capability, all fields from `capability-matrix.md`. No skipped IDs.

## 7. Critical findings

P0 and P1 only. Each: evidence, concrete consequence, and what unblocks it. If there are none, say
that — do not manufacture severity.

## 8. Proposed target-state architecture

Repository-specific Mermaid graph plus narrative. Node names from this project. Deterministic /
model / agent / human distinction, gates, loops, fan-out/fan-in, deployment boundary, feedback
path. Not a copy of the reference diagram.

## 9. Node contracts

| Node | Type | Responsibility | Inputs | Outputs | Tools/permissions | Validator | Failure route |
|---|---|---|---|---|---|---|---|

A node that cannot be described in these terms is too broad — split it.

## 10. Artifact and source-of-truth model

| Artifact | Producer | Consumer | Canonical store | Schema/version | Approval | Lineage |
|---|---|---|---|---|---|---|

Plus lineage rules. Do not force Markdown files where the project already has a better source of
truth. One canonical location per artifact category, or an explicit synchronization rule.

## 11. Gate and authority model

| Gate | Trigger | Required evidence | Approver/authority | Cannot be bypassed by | Reject route |
|---|---|---|---|---|---|

Plus identity boundaries and separation-of-duties rules.

## 12. State, retry, idempotency and recovery model

The smallest viable persisted run-state schema — only fields this repo's workflow actually needs.
Explicit resume semantics for: process crash, network failure, agent timeout, CI worker
replacement, approval arriving days later, duplicate event, partial node completion.

## 13. Verification and evaluation architecture

Deterministic checks available versus enforced. Semantic checks meriting an agent evaluator.
Evaluator independence. Whether an agent can modify the check that judges it. Whether verification
evidence is attached to the PR or run.

## 14. Observability and audit model

Events, correlation IDs, evidence retention, privacy. State whether run / node / actor / tool call
/ transition / retry / approval / failure / artifact / deployment can each be reconstructed, and
whether telemetry risks capturing secrets, source or customer data.

## 15. File-level change plan

| Change ID | Add / Modify / Remove | File / component / platform setting | Responsibility | Reason | Depends on | Validation |
|---|---|---|---|---|---|---|

Concrete enough to execute without the conversation. "Add graph engineering" is not a change.

## 16. Migration roadmap

Dependency-aware phases adapted to the findings — control blockers, foundations, separation and
gates, automation, feedback and scale. Per phase: goal, changes, prerequisites, rollout strategy,
validation, rollback, risks, what becomes possible after.

Prefer progressive rollout for control-plane changes: shadow mode before advisory, advisory before
blocking, read-only agent before write authority, non-production before production. Never propose
full autonomy as a first deployment.

## 17. Validation plan

How to prove the target architecture works, including failure injection: process dies mid-node,
duplicate event arrives, approval waits overnight, validator fails, reviewer disagrees, agent loses
permission, two workers conflict, deployment fails, production incident generates work, untrusted
text attempts to influence tool use.

## 18. Open / externally unverifiable items

Exactly what could not be determined from the repository and what evidence would settle each one.
Phrase each as a request the user can act on in one step.

## 19. Do not build

**Mandatory.** Components, frameworks or services that would be unnecessary or duplicative given
what this repo already has — including ones this report might otherwise seem to imply. Each with
the reason the existing mechanism suffices.

A report without this section is incomplete.
