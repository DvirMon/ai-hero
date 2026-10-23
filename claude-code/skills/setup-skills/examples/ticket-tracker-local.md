# Ticket tracker: Local Markdown

Intake items for this repo live as markdown files in `.scratch/tickets/`.

## Fetch

Read `.scratch/tickets/<slug>.md`. The user normally passes the slug or path directly.

## Create an intake item

Create `.scratch/tickets/<slug>.md` (creating the directory if needed).

Parent epic, per `intake.epic` (unset → ask):

- **link** — add `Parent: <epic-slug>`; the epic file must exist.
- **create** — create `.scratch/tickets/<epic-slug>.md` first, then link as above.
- **none** — no `Parent:` line.

Return the slug.

## Post a comment

Append to a `## Comments` section at the end of the file (create it if missing), one entry per
comment: `### <YYYY-MM-DD>` followed by the body.

## Conventions

- One item per file: `.scratch/tickets/<slug>.md`. The body is the item content, using the
  template `/to-intake` provides.
- An epic is an item file too. A child names it on its first line: `Parent: <epic-slug>`.
- No stage rewrites the body; comments are appended.
