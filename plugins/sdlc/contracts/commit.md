# Commit

How every stage commits. sdlc owns *when* to commit and *what* goes in; *how* the message
looks belongs to the repo's commit skill, when it names one.

## Commit intent

A stage builds one intent per commit:

| Field | Value |
|---|---|
| `type` | `feat` · `fix` · `ref` · `perf` · `test` · `docs` · `chore` · `build` · `ci` · `style` · `revert` |
| `scope` | `<project>[/<domain>]`, per `docs/agents/issue-tracker.md` `## Issue references` |
| `subject` | imperative, lower-case start |
| `issue` | the item the commit belongs to, or none |
| `stage` | story tag stage (`s<N>`, `plan`, `review`), or none |
| `epic` | the epic, when known |
| `ticketTitle` | the ticket's title, when known |
| `paths` | staged by path — never `-A` / `.` |

Pass every value you have. A stage never renders a format itself beyond the plain form below.

## Rendering

Read `capabilities.commit.skill` from the workflow config ([`workflow-config.md`](workflow-config.md)).

- **Unset** → plain conventional, rendered by the stage:

  ```
  <type>(<scope>): <subject>

  <trailer per issue-tracker.md ## Issue references>
  Co-Authored-By: <the exact line from this session's attribution reminder>
  ```

- **Set** → hand the intent to that skill; it renders and commits. Don't restate its format.

**PR title** (`/ship`): the subject line the same renderer produces for the branch's intent,
then ` (#N)`.

## Failures

- **Skill named but not installed** → stop before committing; name the slot and the skill.
- **The skill refuses** (bad format file, required value missing) → stop; report its message as
  the step's blocker. Files stay staged. Don't fall back to plain — a wrong-format commit is
  worse than none.
- **`commit-msg` hook rejects** → fix the message and commit again. Never `--no-verify`, never
  `--amend`.
- **No closing keyword** anywhere in the message (`Closes`, `Fixes`, `Resolves` before `#N`) —
  the PR body owns `Closes #N`.
