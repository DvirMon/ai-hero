# Open questions / gaps: one at a time

When surfacing multiple open questions, gaps, or ambiguities (e.g. from a spec doc, `- [ ]`
checklist, or design doc), never dump them all in one response. Present exactly one at a time,
wait for the user's answer, record it, then move to the next.

- If the question is not complex (clear finite options), use the `AskUserQuestion` tool instead
  of writing it out as prose — gives user structured choices plus free-text override.
- If complex/open-ended (needs explanation, tradeoffs beyond simple options), ask in plain text,
  still one question per turn.
- After each answer, record it (e.g. update the source doc's open-questions section, mark
  resolved, note decision + date) — via a fork, per
  [[fork-doc-writes-during-discussion]], not inline. Don't wait on the fork before presenting
  the next question.
- Do not pre-draft recommendations for all remaining questions up front — only the current one.

## Exception: plan-approval reviews

At a plan-approval gate, the plan may be presented with every open decision at once, each as a
"Decide:" line with a recommendation next to the step it affects. Applies only to: `to-tasks`
§4/§4b, `to-issues` §4, the `ds-plan` checkpoint, and the `ds-spec` checkpoint.

Grilling, interviews and `story:discovery` questions stay one at a time.

**Why:** user decision, 2026-10-18. Reviewing a whole plan in one pass beats approving it node
by node. Open-ended design questions still need the one-at-a-time flow. First written for
HTML plan pages; kept for Markdown reviews when HTML was dropped (token cost).
