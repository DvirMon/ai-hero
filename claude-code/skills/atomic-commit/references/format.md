# Commit format

## Where it comes from

1. `~/.claude/commit-formats.json` — one user-level file, an object keyed by the repo's
   normalised `origin` URL. Keep it out of `~/.claude/skills/` (that folder syncs to a public
   repo).
2. No entry for this repo, no file, or no `origin` → [`default-format.json`](default-format.json).

**Normalising the key:** `git remote get-url origin`, lower-cased, trailing `.git` stripped,
`git@host:owner/repo` rewritten to `https://host/owner/repo`. Same key in every worktree and
clone.

```json
{
  "https://github.com/org/app": {
    "subject": "{issue} {ticketTitle}",
    "laterSubject": "{issue} {subject}",
    "firstBody": ["Resolution Description", "Testing Instructions", "Reviewed By"],
    "trailers": []
  }
}
```

## Fields

| Field | Required | Meaning |
|---|---|---|
| `subject` | yes | subject template |
| `laterSubject` | no | subject for every commit after the branch's first; absent → `subject` |
| `firstBody` | no | body headings for the branch's first commit only; fill each |
| `trailers` | no | trailer line templates, in order |
| `emoji` | no | `type` → emoji; absent → `{emoji}` renders empty |

**First commit on the branch:** no commits in `$(git merge-base origin/<default> HEAD)..HEAD`.

## Placeholders

`{emoji}` `{type}` `{scope}` `{subject}` `{issue}` `{stage}` `{epic}` `{ticketTitle}`

- A `[...]` group or a trailer line containing an empty placeholder is dropped whole.
- Any other placeholder is **required**. Missing → don't commit; name the placeholder and the
  format. Ad-hoc, ask the user instead.
- After rendering, collapse repeated spaces.

`Co-Authored-By: <the exact line from this session's attribution reminder>` is always the last
line, outside the format.

## Errors

- File doesn't parse, or an entry breaks the table above → stop; name the file and the error.
  Never fall back to the default — wrong-format commits in that repo are worse than none.
