# Repo settings + ruleset — `gh api` calls

Run only after the user confirms. `<o>/<r>` = owner/repo from `git remote -v`.

```bash
# Merge buttons: rebase only; auto-merge on; delete head branch on merge
gh api -X PATCH repos/<o>/<r> \
  -F allow_merge_commit=false \
  -F allow_squash_merge=false \
  -F allow_rebase_merge=true \
  -F allow_auto_merge=true \
  -F delete_branch_on_merge=true

# Default branch must be main (origin/HEAD follows it)
gh api -X PATCH repos/<o>/<r> -f default_branch=main
git remote set-head origin --auto

# Ruleset on the default branch
gh api -X POST repos/<o>/<r>/rulesets --input rulesets/main.json

# Read back
gh api repos/<o>/<r> --jq '{allow_merge_commit,allow_squash_merge,allow_rebase_merge,allow_auto_merge,delete_branch_on_merge,default_branch}'
gh api repos/<o>/<r>/rulesets
```

Order matters: the ruleset (required checks) must exist before `/ship`
turns on auto-merge, or auto-merge merges without CI.

The required checks `ci-gate` and `pr-conventions` must have run at least
once on a PR before GitHub offers them — create the ruleset after the
workflows land, or accept a PR stuck "Expected" until they run.

## Secrets (user creates; never echo values)

| Secret | Used by | Scope |
|---|---|---|
| `ANTHROPIC_API_KEY` | `claude-review.yml` | Anthropic API key |
| `PIPELINE_TOKEN` | `issue-flow.yml`, `rebase-behind-prs.yml` | fine-grained PAT on this repo: Contents, Pull requests, Issues = read/write (+ Workflows if PRs edit `.github/workflows`) |

```bash
gh secret set ANTHROPIC_API_KEY
gh secret set PIPELINE_TOKEN
```
