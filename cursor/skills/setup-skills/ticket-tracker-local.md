# Ticket tracker: Local Markdown

Intake tickets for this repo live as markdown files in `.scratch/tickets/`.

## Conventions

- One ticket per file: `.scratch/tickets/<slug>.md`
- The file body is the ticket content, using the template `to-ticket` provides

## When a skill says "create an intake ticket"

Create a new file at `.scratch/tickets/<slug>.md` (creating the directory if needed).

## When a skill says "fetch the intake ticket"

Read the file at `.scratch/tickets/<slug>.md`. The user will normally pass the slug or path directly.
