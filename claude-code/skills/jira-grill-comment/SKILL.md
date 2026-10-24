---
name: jira-grill-comment
description: Drafts and posts a Jira comment @-mentioning a named person with spec-grill questions and a default recommendation per row. Use for posting grilling gaps on Jira to product, design, BE, or any stakeholder the user names.
---

# Jira grill comment

**Draft in chat → post only after explicit approval.** Atlassian MCP: cache `cloudId` from `getAccessibleAtlassianResources`, then `addOrEditJiraIssueComment` (markdown `commentBody`).

Collect: issue key, `@` display name, topic, who implements if silent (`FE` / `BE` / `we`), items from spec/decisions (each needs id, question, recommendation, basis). Optional “Separate follow-up later: …” paragraph. No TBD rows.

**Reference:** UI-related → Loom or Figma the user confirms; ask before posting if missing. Non-UI → spec/flow/page. Generic toasts → note platform-standard, no Figma.

**Basis** prefix exactly one of: `Reasoning only`, `Mostly reasoning`, `Partly existing` — then ` — ` and one sentence.

```text
Hi @<Name> — <topic> (spec grilling). The ticket is silent on these; <implementer> will implement the recommendation in each row unless you say otherwise.

<Id> — <title>
Question: <either/or>
Recommendation: <default>
Basis: Partly existing — <why>.
Reference: <Loom/Figma/page, or ask user for UI>.
```

Minimal shape (one item):

```text
Hi @Avita Flit — Active Sessions UI (spec grilling). The ticket is silent on these; FE will implement the recommendation in each row unless you say otherwise.

F1 — Sign out when session already gone (404)
Question: Treat DELETE 404 as success (remove row + success toast) or show an error?
Recommendation: Success — same toast as happy path.
Basis: Reasoning only — no existing DELETE-404-as-success pattern.
Reference: Flow 1 success toast — ask for Loom if UI proof needed.
```
