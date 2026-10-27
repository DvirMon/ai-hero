# review-threads

Triage the unresolved review threads on a GitHub PR or GitLab MR from Claude Code.

```
/review-threads [PR/MR number or URL]
```

Trusted trivial threads (typo, naming, unused import) are fixed automatically, each as its
own verified commit. Everything else waits for your approval in chat. One push, then replies
and resolves.

Needs `gh` (GitHub) or `glab` (GitLab), logged in, and Node 18.3+.

## Config

`~/.claude/review-threads/config.json`:

```json
{
  "hosts": { "git.corp.example": "gitlab" },
  "defaults": {
    "autoCategories": ["typo", "naming", "unused-import"],
    "trustedBots": ["coderabbitai[bot]"],
    "protectedPaths": ["infra/**"],
    "resolve": "auto-and-bots",
    "stateDir": "work/*/active/*{issue}*/review"
  },
  "projects": {
    "gitlab.com/group/sub/project": {
      "fixers": [{ "glob": "**/*.ts", "skill": "angular-developer", "verify": "npx nx affected -t typecheck --files={files}", "sep": "," }]
    }
  }
}
```

A repo may add `.claude/review-threads.json`, read from the PR **base** branch. It can add
`fixers` and only tighten `protectedPaths`, `gatedPaths`, `autoCategories`, `trustedBots`.

Design: [docs/design.md](docs/design.md). Decisions and API probes: [docs/decisions.md](docs/decisions.md).
Tests: `node --test plugins/review-threads/test`.
