# review-threads plugin — design decisions (critique round)

These decisions resolve the critique of the design from 2026-10-27.

## D1 — Auto-fix trust

- **Decision:** Only threads whose author has write access (GitHub)
  or Developer+ role (GitLab), or is a bot listed in config, may
  enter the auto-fix path. Every other thread is always gated.
  A script checks access; the model never decides it.
- **Why:** Thread text is untrusted input. An unchecked commenter
  could steer a pushed change that no human reviewed.

## D2 — Severity vs gate

- **Decision:** Each thread record carries a separate
  `gate: auto | gated | question` field. Rules derive it from
  trust, category, protected path and reviewer signal. P0–P3
  stays a display and ordering label, with the code-review
  contract's meaning unchanged. P0–P3 never decides gating. The
  contract's downward verify pass does not run on threads.
- **Why:** The contract defaults findings without evidence down
  to P3. Thread gating defaults unknown threads up to gated. One
  scale cannot hold both defaults.

## D3 — Gate rules and auto entry

- **Decision:** Deterministic rules run first, in this order:
  1. Untrusted author (D1) → `gated`.
  2. Question thread → `question`.
  3. Reviewer signal `issue`, `(blocking)` or `todo` → `gated`.
  4. Unknown → `gated`.

  A trusted thread with no explicit signal may reach `auto` only
  when both of these hold:
  - The model proposes a fixed category: typo, naming,
    unused-import or project-rule.
  - A script validates the resulting fix diff against that
    category's shape:
    - typo: changes to comments or strings only.
    - unused-import: only import lines removed.
    - naming: rename of a non-exported symbol.
    - project-rule: the shape the fixer skill defines.

  A shape mismatch reverts the fix and sets `gated`. The
  protected-path check also runs on the fixer's resulting diff,
  not only on the thread's anchor path.
- **Why:** Discovery found LLM-only classification unreliable
  (F1 ~46). The diff-shape check makes the model's call
  mechanically verifiable. An exported rename in a library is a
  P1 public-API break.

## D4 — Verification

- **Decision:** Config names a `verify` command per glob. Its
  only placeholder is `{files}`, for example
  `npx nx affected -t typecheck --files={files}`. This was aligned
  with design §3: a generic plugin cannot map files to Nx
  projects. The command runs after
  each fix commit, before the next fix starts. A verify failure
  or a commit-hook rejection reverts only that commit. The thread
  then moves to `gated`, with the error attached.
- **Why:** Per-commit verification isolates failures, so a revert
  never conflicts with later commits on the same file. "Typecheck"
  alone is stack-specific. Repos with enforced commit formats can
  reject a fixer's commit.

## D5 — Push cadence

Supersedes the earlier decision "each gated thread: own commit,
push, reply, resolve".

- **Decision:** These steps run in this order:
  1. Approve gated threads first, through AskUserQuestion, up to
     4 threads per call.
  2. Fix each approved thread as its own verified commit (D4).
  3. Push once, together with the auto batch.
  4. Post replies and resolves only after that push.
- **Why:** Per-thread pushes multiply CI runs, reviewer
  notifications and stale-approval dismissals by the thread
  count. Per-thread commits already give each thread its own
  revertable SHA.

## D6 — Where fixes run

- **Decision:** By default, fixes run in the current checkout, on
  the PR branch. Per thread, the user may send a thread to its own
  session, in a worktree created at the PR head. That worktree is
  never created from the default branch.
  - Each gated approval card offers this as a 4th choice, "Own
    worktree session".
  - The model marks that choice "suggested" when the fix looks
    large (multi-file or an API change). The user decides.
  - This unifies with the earlier decision "a separate session
    per Discuss thread, only on the user's yes".
  - A worktree thread leaves the current run. Its fix, push,
    reply and resolve happen when that session finishes.

  These steps run before the single push (D5):
  1. Fetch.
  2. If the remote moved, rebase the local fix commits.
  3. Re-read the thread→SHA map from commit trailers. Each fix
     commit carries a `Review-Thread: <id>` trailer, so the map
     stays correct after any rebase.
- **Why:** The user works best on one branch, in context. Large
  threads still deserve isolation. Trailers keep the SHAs in
  replies correct after rebases.

## D7 — Uncommitted changes

- **Decision:** In the default same-checkout mode (D6), a run
  starts only if the working tree is clean and on the PR branch.
  Otherwise it refuses to start. The user commits or parks their
  own work first.
- **Why:** This is the simplest guarantee that a fix commit
  never mixes in the user's own edits. It also guarantees that a
  revert (D4) never overwrites them.

## D8 — Pending draft review

- **Decision:** At fetch time, the run checks whether the user
  has a pending (unsubmitted) GitHub review, or GitLab draft
  notes, on the PR or MR. If so, the run stops before any work.
  It tells the user to submit or discard the draft, then re-run.
- **Why:** Replies can attach to the draft and stay invisible to
  reviewers. Stopping first leaves nothing half-done. This is the
  same behavior as `ce-resolve-pr-feedback`.

## D9 — Re-run behavior

- **Decision:** Every plugin reply carries a hidden marker, for
  example
  `<!-- review-threads:v1 thread=<id> decision=<fixed|declined|question|already-addressed> -->`.
  - On re-run, the run skips a thread whose latest comment is
    our marked reply. The thread returns only when someone
    comments after that reply.
  - Declined threads get a short, user-approved reply that
    states the outcome. They stay open.
  - Before the run posts any reply, it searches the thread for
    our marker. A retry therefore never double-posts.
- **Why:** This works from any machine, and it survives losing
  `review.json`. It also avoids re-triaging declined and question
  threads on every run.

## D10 — Config trust and merge

- **Decision:** The run reads the repo-level
  `.claude/review-threads.json` from the PR's target (base)
  branch, never from the head.
  - The repo file may freely set fixer maps and verify commands.
  - For safety fields, the repo file may only tighten the
    user-level config, never loosen it. The safety fields are
    protected paths, auto-fix categories, trusted bots and
    `gatedPaths`. `gatedPaths` replaced "min severity" in design
    §3, because P no longer gates (D2).
  - The config file itself is a protected path.
- **Why:** A PR must not be able to change the rules that judge
  it. That covers a contributor's PR and a fixer's own edit. An
  org file must not disable personal protections.

## D11 — Resolve policy

Supersedes the earlier decision "resolve every thread a commit
fixed".

- **Decision:** Config field `resolve: all | auto-and-bots | none`
  sets the policy. The default is `auto-and-bots`.
  - The plugin resolves bot threads and `auto`-gate threads after
    the push and the reply.
  - Gated threads from human reviewers get the reply with the
    commit link. They stay open for the reviewer to confirm and
    resolve.
  - Declines and question replies still never resolve.
- **Why:** On many teams, the reviewer owns resolving their own
  thread. Auto-resolving a human's gated thread implies their
  sign-off. Bot threads would otherwise pile up.

## D12 — Re-request review

Supersedes the earlier decision "re-request reviewers whose
threads were fixed".

- **Decision:** Re-request a human reviewer only when none of
  their threads still waits on the PR author. A thread no longer
  waits when it is fixed, declined with a reply, or answered.
  Worktree-session threads count as waiting.
  - Never re-request bots.
  - On GitLab, use whatever re-request mechanism the API
    supports. Verify it during the build. If none exists, skip
    the re-request and say so in the run summary.
- **Why:** This avoids pinging reviewers who still have pending
  threads. It also avoids bot re-review loops. Discovery found
  no GitLab re-request call.

## D13 — Scope

- **Decision:** The run triages, fixes, replies to and resolves
  only inline and file-level review threads. It lists these
  comments read-only in the end-of-run summary shown in chat:
  - review-summary bodies
  - PR/MR conversation comments
  - bot outside-diff findings, such as CodeRabbit's summary block

  The user acts on those comments. The run does not post the
  summary as a PR comment, so "no summary comment" still holds.
- **Why:** Those comments cannot be resolved and have no anchor
  line, so they break the resolve and marker model. Listing them
  prevents silent misses.

## D14 — Where things live

Refines the earlier state and artifacts decision.

- **Decision:** Plugin configuration stays user-level, at
  `~/.claude/review-threads/...`, plus the repo file per D10.

  Per-PR run state (`review.json`, `handoff.md`) lives at the
  ticket level:
  - Config sets `stateDir` as a template, for example
    `work/*/active/*{issue}*/review`.
  - The only placeholders are `{branch}`, `{pr}` and `{issue}`.
    `{issue}` is parsed from `Closes #N` in the PR body, or from
    the branch name.
  - The template may also contain `*` wildcards. It must resolve
    to exactly one existing folder.
  - Several matches: the run asks the user which folder to use.
  - Zero matches, or no template: the state falls back to
    `${CLAUDE_PLUGIN_DATA}/<host>/<project-path>/<pr>/`.
  - The ticket-level folder stays excluded from git through
    `.git/info/exclude`.

  D9 markers can rebuild the state, so the local file is a cache,
  not the source of truth.
- **Why:** The user wants run artifacts next to the ticket they
  belong to. Generic users without a ticket workspace still work
  with zero setup.

## D15 — Multi-comment threads

- **Decision:**
  - The fixer reads the whole thread as context.
  - Trust (D1) requires every author in the thread, other than
    the PR author, to be trusted. Otherwise the thread is gated.
  - The gate takes the strictest signal across all comments. A
    later `(blocking)` beats an earlier `nit:`.
  - A later retraction ("your call") from the original reviewer
    may lower a thread only to gated, never to auto.
- **Why:** A single untrusted or later comment must not steer a
  fix that no human reviewed.

## D16 — Defaults

These defaults were not separately debated.

- **Decision:**
  - Preflight stops if the PR head is not pushable, for example
    a fork PR or missing permission.
  - Config is keyed by the full project path, so GitLab subgroups
    work. The host is normalized from the git remote.
  - Replies post one at a time, throttled for GitHub's secondary
    rate limits.
  - Probe these during the build:
    - GitLab outdated-thread detection.
    - Bot-author fields.
    - The GitLab re-request mechanism.
    - Whether GitLab `/version` answers without authentication.

## Build probes (D16, design §8)

Checked against official docs on 2026-10-27. "Unverified" means the
docs do not say; the build designs around it.

### P1 — GitLab outdated-thread detection: unverified

- `docs.gitlab.com/api/discussions/` documents no `outdated`,
  `change_position` or `original_position` field.
- `position.head_sha` is documented; MR `diff_refs.head_sha` and `sha`
  are documented. No page says comparing them marks a thread outdated.
- **Built:** the GitLab adapter always sets `outdated: false` and sets
  `staleAnchor` (head SHA differs) as an informational field. Nothing
  gates on it. The orchestrator re-reads the code at the anchor for
  every thread anyway (design step 3).

### P2 — Bot-author fields

- GitHub GraphQL: `PullRequestReviewComment.author` is `Actor`;
  `Bot` implements it, so `__typename` is verified. **Built:** bot =
  `__typename == "Bot"`.
- GitHub REST `user.type` and the `[bot]` login suffix: unverified
  (no enum, no mention). GraphQL logins for bots omit `[bot]` in
  practice but this is also unverified. **Built:** logins compare
  lowercase with a trailing `[bot]` stripped.
- GitLab: the discussion-note author object shows only `id, name,
  username, state, avatar_url, web_url`. A `bot` flag appears only in
  `GET /user(s)` example JSON. **Built:** a username heuristic marks
  likely bots, but only logins listed in `trustedBots` are ever trusted
  as bots.

### P3 — GitLab re-request mechanism: found

- GraphQL mutation `mergeRequestReviewerRereview`; input `iid: String!`,
  `projectPath: ID!`, `userId: UserID!` (reference: mutations page).
- Quick action `/request_review @user` also resets state, but posts a
  note, so it is not used.
- No REST endpoint is documented. **Built:** the mutation, per human
  reviewer, with their numeric user id from the note author.
- GitHub: `POST /repos/{o}/{r}/pulls/{n}/requested_reviewers/rerequest`
  (`reviewers`, `team_reviewers`) is listed on the review-requests page.

### P4 — GitLab `/version` without authentication: unverified

- `docs.gitlab.com/api/version/` shows `PRIVATE-TOKEN` in every example
  and states nothing about anonymous access.
- **Built:** no network probe to detect the provider. Order: PR/MR URL
  shape, `hosts` map in the user config, well-known hostnames
  (`github.com`, `*.ghe.com`, `gitlab.com`, `gitlab.*`). Otherwise
  preflight stops with `provider-unknown` and asks for a `hosts` entry.

### P5 — Hooks that reject unknown trailers

- Conventional Commits footers are `token: value` and the spec does not
  restrict tokens. commitlint's footer rules (`footer-leading-blank`,
  `footer-max-length`, `footer-max-line-length`, `trailer-exists`) do
  not reject unknown tokens, so default commitlint accepts
  `Review-Thread:`.
- Custom hooks (like ng-table's allowlist parser) are outside official
  docs: unverified in general.
- **Built:** a commit-hook failure whose output mentions a trailer or
  footer returns `hint: hook-may-reject-trailer`; the orchestrator
  names it in the report.

### Other verified facts used by the build

| Fact | Source |
|---|---|
| Write access: `GET /repos/{o}/{r}/collaborators/{u}/permission`, `role_name` carries maintain/triage | docs.github.com/en/rest/collaborators/collaborators |
| `authorAssociation` is not documented as a write-access signal, so it is not used | docs.github.com/en/graphql/reference/issues |
| GitLab Developer = access level 30; `GET /projects/:id/members/all/:user_id` includes inherited | docs.gitlab.com/api/project_members |
| Pending review: `PullRequest.reviews(states: [PENDING])`; GitLab `GET …/draft_notes` (visible only to the author) | docs.github.com/en/graphql/reference/pulls, docs.gitlab.com/api/draft_notes |
| `isCrossRepository`, `maintainerCanModify`, `Repository.viewerPermission` (null for GitHub Apps) | docs.github.com/en/graphql/reference/pulls, /repos |
| `databaseId` is deprecated; `fullDatabaseId` (BigInt) is used as the REST reply id | docs.github.com/en/graphql/reference/pulls |
| `comments(first, after)` with `pageInfo` on the thread, so nested comments are paginated by hand | docs.github.com/en/graphql/reference/pulls |
| GitLab resolve: `PUT …/discussions/:id` with `resolved=true`; reply: `POST …/discussions/:id/notes` with `body` | docs.gitlab.com/api/discussions |
| `glab api` has `-X`, `-f`, `-F`, `--hostname`, `--input`; `--paginate` output shape is undocumented, so pages are fetched by hand | docs.gitlab.com/cli/api |
| `gh api`: `-f`, `-F`, `-X`, `--hostname`, `--input` | cli.github.com/manual/gh_api |
| Wait at least one second between write requests | docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api |
| `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_DATA}` are substituted inline in skill text, but are **not** in the Bash tool environment | code.claude.com/docs/en/plugins-reference |
| Trailer block is at the end after a blank line; `%(trailers:key=…,valueonly)` is valid | git-scm.com/docs/git-interpret-trailers, /pretty-formats |

## Build decisions (not in D1–D16)

- **B1 Config snapshot in `review.json`.** Preflight stores the merged
  config and the run context under `run` in `review.json`, so later
  scripts and the fixer cannot see a changed config mid-run. Design §2
  listed two files; the third copy of this data would be worse.
- **B2 Default `autoCategories`** are `typo`, `naming`, `unused-import`.
  `project-rule` is opt-in.
- **B3 `project-rule` shape** is a generic bound the fixer skill cannot
  loosen: anchor file only, at most `projectRuleMaxLines` (default 12)
  changed lines, no `export` line touched. Auto also needs a matching
  `verify` command; with none, the thread goes to gated.
- **B4 Auto fixes edit only the anchor file** (no added or deleted
  files). Shape checks support JS/TS, a few C-like languages, hash
  comment languages and prose; any other file type fails closed to gated.
- **B5 Markers count only when the viewer wrote the comment.** Anyone can
  paste a marker to hide a thread.
- **B6 Optional `sep` on a fixer entry** joins `{files}` (default space).
- **B7 `resolve` policy** applies only to `fixed` and `already-addressed`
  replies; declined and question replies never resolve.
- **B8 Config keys:** user file `~/.claude/review-threads/config.json`
  has `defaults`, `hosts` and `projects["<host>/<project path>"]`.
  Repo fixers go first, so they win the first-match rule.

## Unverified (carry-over)

- GitLab outdated detection (P1), GitLab bot flag (P2), anonymous
  `/version` (P4), custom hooks that reject unknown trailers (P5).
- The adapters and fixtures are written from the documented field
  shapes; no real GitHub or GitLab response was recorded. Run the
  adapters against one real PR and one real MR before relying on them.
- `glab api graphql -f query=…` with `-F iid=…` typed fields, and the
  exact GitLab `UserID` global-id format `gid://gitlab/User/<id>`, are
  assumed from GitLab's GraphQL conventions, not read in docs.
