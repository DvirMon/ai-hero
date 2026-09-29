# Branch-workflow templates

Copied into a repo by `setup-skills` § Branch workflow bootstrap.
Policy: one issue = one branch = one PR; no commits on the default branch;
rebase-merge only; emoji conventional commits with a `Refs:` trailer;
`Closes #N` only in the PR body.

| Template | Goes to | Layer |
|---|---|---|
| `hooks/pre-commit`, `hooks/pre-push` | `.husky/` or `.githooks/` | git hooks |
| `tools/validate-branch-name.mjs` | `tools/` | single branch-name rule (hook + CI) |
| `commitlint.config.js` | repo root | commit + PR-title header rule |
| `pull_request_template.md` | `.github/` | PR body shape `/ship` fills |
| `workflows/pr-conventions.yml` | `.github/workflows/` | required check |
| `snippets/ci-gate.yml` | into existing `ci.yml` | required check |
| `workflows/claude-review.yml` | `.github/workflows/` | advisory review |
| `workflows/issue-flow.yml` | `.github/workflows/` | unblock + epic archive |
| `workflows/rebase-behind-prs.yml` | `.github/workflows/` | keeps auto-merge PRs current |
| `rulesets/main.json`, `repo-settings.md` | `gh api` | server enforcement |

Branch names: `<type>/<N>-<slug>` (issue), `docs/<slug>[-<topic>]`
(planning), `chore/<slug>-archive`, `chore/sync-<date>`.
Commit trailer: `Refs: #N`, or `Refs: none` (planning workspace-open commit).

Pin every `uses:` by commit SHA at install (tags shown are the latest
releases on 2026-09-25).

## Verified facts (2026-09-25)

- `anthropics/claude-code-action` latest release `v1.0.234` (major tag `v1`);
  inputs used — `anthropic_api_key`, `prompt`, `claude_args`,
  `use_sticky_comment` — exist in its `action.yml`; permissions and
  `--allowedTools` follow `examples/pr-review-comprehensive.yml`.
  https://github.com/anthropics/claude-code-action/blob/v1.0.234/action.yml
  https://github.com/anthropics/claude-code-action/blob/v1.0.234/examples/pr-review-comprehensive.yml
- Latest releases: `actions/checkout` v7.0.1, `actions/github-script` v9.0.0,
  `actions/setup-node` v6.5.0 (`gh release list`).
- `PUT /repos/{o}/{r}/pulls/{n}/update-branch` has only `expected_head_sha`
  and "merges HEAD from the base branch into the pull request branch" — no
  rebase option, so `rebase-behind-prs.yml` rebases with git.
  https://docs.github.com/en/rest/pulls/pulls#update-a-pull-request-branch
- Issue dependencies REST: `GET …/issues/{n}/dependencies/blocked_by` and
  `GET …/issues/{n}/dependencies/blocking` (used instead of GraphQL
  `blockedBy`, which could not be confirmed from the docs page).
  https://docs.github.com/en/rest/issues/issue-dependencies
- Sub-issues REST: `GET …/issues/{n}/parent`; issue objects carry
  `sub_issues_summary {total, completed, percent_completed}`.
  https://docs.github.com/en/rest/issues/sub-issues
- Ruleset body: `pull_request.parameters.allowed_merge_methods`
  (`merge|squash|rebase`), `required_status_checks` with
  `strict_required_status_checks_policy`, simple rules
  `required_linear_history`, `non_fast_forward`, `deletion`.
  https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset
- Events caused by `GITHUB_TOKEN` don't start new workflow runs (except
  `workflow_dispatch`/`repository_dispatch`), hence `PIPELINE_TOKEN` for
  pushes that must run CI.
  https://docs.github.com/en/actions/concepts/security/github_token

## Known limits

- `issue-flow` archive repairs links by rewriting `active/<slug>` →
  `archive/<slug>` in tracked `.md`/`.json`; relative links that don't
  contain that segment are not repaired (`doc-archiver` does a fuller pass).
- `claude-review` inlines the code-review skill's two axes; the user-level
  skill itself isn't available on the runner.
