# Tracker

The operations a pipeline stage asks of a tracker. This contract names no tracker. Each repo
implements the operations in two files of its own, written by `setup-skills`:

| File | Holds | Read by |
|---|---|---|
| `docs/agents/ticket-tracker.md` | the intake item — the ask that starts the pipeline | `/to-intake`, `/to-ticket`, `grill-with-docs`, `/to-spec` |
| `docs/agents/issue-tracker.md` | the work items under it, and how commits and PRs reference them | `/to-issues`, `/implementation`, `/ship`, the commit renderer ([`commit.md`](commit.md)), `code-review` |

Both files may name the same tool. A stage reads the file, follows the section, and never
branches on a tracker name.

**Each operation section** says how it is done, as one of:
- a CLI command (`gh`, `glab`, `acli`, …), with the exact flags;
- an MCP tool, by name;
- `skill:<name>` or `agent:<name>` — an org's own tooling runs it;
- `manual` — the stage prints what to do and waits.

Setup writes each section after asking which tracker the repo uses and checking which CLIs and
MCP servers are available. `${CLAUDE_PLUGIN_ROOT}/skills/setup-skills/examples/` holds filled-in files for common trackers;
setup starts from the matching one. No stage reads `examples/`.

## `ticket-tracker.md`

| Section | Takes | Returns |
|---|---|---|
| `## Fetch` | a ref | title, description, acceptance criteria, URL |
| `## Create an intake item` | title, body, epic: link `<ref>` · create · none | the new ref |
| `## Post a comment` | a ref, Markdown body | — |

Never edit an item's description — product owns it. Anything new goes in a comment.

## `issue-tracker.md`

| Section | Takes | Returns |
|---|---|---|
| `## Fetch` | a ref | title, body, state, labels |
| `## Create a child` | the parent ref, title, body | the new ref |
| `## Readiness` | a ref, rung, dated reason | — ; also where `/implementation` reads the rung |
| `## Issue references` | — | how a commit and a PR body reference an item, and how it closes |

A section the tracker cannot do says `Not supported` and what the stage does instead. A
missing section is a setup error: the stage stops and names it.

## Repo-only rules

Rules that hold for this repo only — key casing, extra labels, epic conventions, triage —
go in the same file, under their own heading after the operations.
