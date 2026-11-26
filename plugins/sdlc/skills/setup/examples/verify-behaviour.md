# Behaviour verify — repo facts

Read by `/verify-behaviour` and `sdlc:test-planner` on every run, so neither rediscovers them.
Settings (browser, logins, DB command) live in `.claude/workflow.json` →
`stages.verify-behaviour`; this file holds facts about the app. Edit it directly.

## Routes

| Page | Route | Reached from |
|---|---|---|
| Company list | `/companies` | main nav "Companies" |
| Company form | `/companies/:id/edit` | "Edit" in a company row |

## Test data rules

- Emails: the API's Joi `email()` rejects the `.test` TLD — use `.com` (e.g.
  `verify-<case>@example.com`).
- Forms: the "Commit" button stays disabled until a field changes. Change a field before
  checking that "Commit" is enabled.
- Name every fixture `verify-<case>-<short-id>` so cleanup can find it.

## Not automatable

Checks that need these are `blocked` up front — test by hand:

- Azure SSO sign-in
- Google SSO sign-in

## Cleanup

- Delete every company named `verify-*` from the company list ("Delete" in its row).
- Users created by a case: remove from the users page; never delete a seed user.

## Database

Off. DB checks run only when `stages.verify-behaviour.db` is set in `.claude/workflow.json`.
When on: read queries only; tables worth checking — `companies`, `users`.
