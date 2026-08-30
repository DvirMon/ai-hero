---
name: generate-claude-md
description: Generate a lean, token-efficient CLAUDE.md file for any project type (single repo, monorepo, microservices, API project). Use when the user wants to create, bootstrap, or rewrite a CLAUDE.md from scratch.
---

# CLAUDE.md Generator

Produce a lean, token-efficient `CLAUDE.md` tailored to the project's actual shape — not a
generic template. Every line must earn its place: if Claude wouldn't make a mistake without it,
cut it.

## 1. Elicitation (quick path)

Ask using the AskQuestion tool if available, else ask conversationally, in one batch — don't
interview one question at a time:

1. **Project type** — single repo / monorepo / microservices / API project
2. **Primary tech stack** — e.g. Node.js + React, Python, Go (if the user isn't sure, tell them
   to check `package.json`, `go.mod`, `requirements.txt`, `Cargo.toml`, etc., or run `ls -la` at
   the root, and read that yourself rather than guessing)
3. **Non-default conventions** — does the team deviate from stack defaults? If yes, get 2-3
   concrete examples
4. **Shared or personal** — committed team file (`./CLAUDE.md`) or personal
   (`~/.claude/CLAUDE.md`)
5. **Critical gotchas** — any edge cases that have bitten people before? If yes, get 1-2
   concrete examples
6. **Escalation areas** (optional) — any areas needing human review before merge (auth, payments,
   core data, prod config)? Skip the section entirely if the user has none.

Skip questions you can already answer by reading the repo (e.g. don't ask "what's your tech
stack" if `package.json` is sitting right there — confirm it instead of asking blind).

## 2. Research phase

Before writing, decide:

- **Size target** — single repo ~150 lines; monorepo ~120 lines at root + thin subdir files;
  API-heavy projects get an added integrations section but stay under ~180 lines total.
- **Section order** — context → commands → structure → conventions → references → gotchas.
  Keep this order; it's scannable top-to-bottom from "what is this" to "what will bite me."
- **Progressive disclosure** — anything that would push the root file past its size target
  (detailed API integration patterns, a large gotcha list, module-specific rules) belongs in an
  `@import`ed file or a subdirectory `CLAUDE.md`/`.claude/rules/*.md`, not inline.

## 3. Generation phase

Write the file with these sections, using the user's actual commands and structure — never
placeholder syntax like "your build command":

- **Project context** (1-2 lines) — what this is, in plain terms.
- **Commands** — exact dev/test/build/lint invocations (`npm run dev`, `pytest -x`, `go build
  ./...`), not descriptions of them.
- **Project structure** — a directory map. For monorepos, mark which subdirs have their own
  CLAUDE.md.
- **Conventions** — only non-default patterns, i.e. things that differ from stack/tool defaults
  or that a linter won't catch. Tag anything critical with **IMPORTANT** or **YOU MUST**.
- **Reference docs** — links/paths to fuller docs, each with a "Read when ..." trigger so Claude
  knows when to open it instead of reading it every time.
- **Gotchas** — concrete project-specific traps, phrased as the failure mode, not a lecture.
- **Escalation** (optional, only if the user named review-gate areas) — bullet list of areas
  needing human review before merge, e.g. "Changes to auth, payment, core data." Omit the
  section entirely rather than writing a placeholder if none were named.

### Monorepo placement

- Root `CLAUDE.md`: shared conventions only (build system, git workflow, repo-wide commands).
- Subdirectory `CLAUDE.md`: service/module-specific rules (e.g. `apps/api/CLAUDE.md` for backend
  patterns, `apps/web/CLAUDE.md` for component conventions).
- State this split explicitly in the root file so it's clear where to look next.

### Domain-level CLAUDE.md

Below app/service level, some folders carry enough independent responsibility (nested
sub-services, non-trivial business logic, a bounded-context name like `payments`, `auth`,
`tickets`) to deserve their own `CLAUDE.md`, distinct from a generic technical-layer folder
(`utils`, `shared`, `components`).

Don't score this against a fixed checklist — reason per folder about its actual responsibility
and importance in the scanned structure (depth of nested logic, whether other domains depend on
it, whether it reads as a business capability vs. a technical layer). Judgment call, not a
formula.

No separate registry/config file for tracking domains — record them in the existing `CLAUDE.md` /
`CONTEXT-MAP.md` structure (e.g. root file lists which subdirs got their own `CLAUDE.md`, same as
the app-level split above).

**This skill is re-run over a project's life, not just once at bootstrap.** Each activation does
both of the following:

1. **Scan for new/changed domains** — walk the current folder structure, reason about which
   folders now look like domains. For each candidate, don't auto-generate a file — surface it as
   a recommendation and ask the user one at a time (per
   `.claude/rules/open-questions-one-by-one.md`) whether it warrants its own `CLAUDE.md`. Record
   accepted domains in the parent `CLAUDE.md`/`CONTEXT-MAP.md`.
2. **Review existing CLAUDE.md files for staleness** — for each `CLAUDE.md` already in the repo
   (root, app, domain), check it against current repo state: stale file/command references,
   renamed or removed paths, structural drift since the file was last written. Flag candidates
   for refresh; don't silently decide to rewrite without telling the user what looks stale.

**Execution order** — this skill plans the work, then writes every file itself, one after
another:

- Scanning, reasoning about candidates, and asking the user needs a single whole-repo view — do
  this first, inline, before writing anything.
- For each accepted domain (`create` or `refresh`), work through it in turn: re-read that
  domain's source, note the reason it qualified, check the nearest ancestor `CLAUDE.md` for
  tone/format consistency, then write or refresh that domain's `CLAUDE.md` following section 3's
  structure above. Repeat sequentially for every accepted domain — there's no need to batch or
  parallelize these; each one is a small, independent write.
- Root/app-level `CLAUDE.md` generation (section 3 above) happens the same way, inline.
- After all domain files are written, update the parent `CLAUDE.md`/`CONTEXT-MAP.md`'s domain
  listing to reflect them.

### API-heavy projects

Add an "API Integrations" section: auth pattern, error/retry handling, webhook verification if
relevant. Link to the external API's docs rather than reproducing them.

### Personal setup

If the user chose personal/local scope, write to `~/.claude/CLAUDE.md` or `./CLAUDE.local.md`
(gitignored) instead of `./CLAUDE.md`, and say so explicitly — don't silently commit a personal
file to a shared repo.

## 4. Quality checks (before writing the file)

- [ ] Root file under 200 lines (single repo) / ~120 lines (monorepo root)
- [ ] Every line answers "would Claude make a mistake without this?"
- [ ] No self-evident instructions ("write clean code", "use meaningful names")
- [ ] No standard language/framework conventions a linter already enforces
- [ ] No file-by-file descriptions or detailed API docs reproduced inline (link instead)
- [ ] Concrete examples over vague guidance throughout
- [ ] Markdown is scannable: headers, bullets, tables — not prose paragraphs

## 5. After writing

1. Report the line count.
2. If any section feels redundant or borderline self-evident, flag it and suggest cutting it
   rather than leaving it in.
3. Ask: "Does this look right, or should I adjust a section?"

## Edge cases

- **No conventions yet**: write the lean skeleton (context, commands, structure) and add a note:
  "Add project-specific rules here as patterns emerge." Don't invent conventions that don't
  exist.
- **Large/complex project**: recommend splitting from the start — root file for shared rules,
  `.claude/rules/*.md` or subdir `CLAUDE.md` files for the rest — and show the split rather than
  writing one long file.
- **Unsure tech stack**: read the repo yourself (`package.json`, `go.mod`, `requirements.txt`,
  lockfiles) before asking the user to guess.
