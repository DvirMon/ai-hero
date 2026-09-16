---
name: kipi
description: Generate or refresh colocated docs/ folders by reading actual source code. File set and templates are entirely config-driven (docs/agents/domain-docs.md) — this skill has no opinion on doc names. Runs single-domain or whole-repo (discovers every domain, documents them one at a time).
disable-model-invocation: true
portedFrom: 863d1585389f
---

# Kipi

Read a domain's source (component/feature/package/app) and generate its `docs/` folder in place — content synthesized from real code, not scaffolding. Two modes: **single domain** (a path given or confirmed) or **whole repo** (discover every domain, document all of them, one at a time).

Domain = public API boundary, per this repo's [file-organization.md](../../rules/file-organization.md) colocation rule: docs live next to the code they describe, not centralized.

This skill has no built-in list of doc filenames or sections — that is entirely the config file's responsibility (below). Don't hardcode or assume a file set anywhere in this process.

## Config resolution

Look for `docs/agents/domain-docs.md` at repo root — it is the sole source of truth for which files get generated per domain and what sections each requires.

- **Exists** → use its file list and section templates as-is. Nothing else to decide.
- **Missing** → read this repo's own conventions yourself (root `CLAUDE.md`/`AGENTS.md`, any file-organization rules, any existing hand-written `docs/` folders) and propose a file/section list grounded in what this specific repo already does — not a generic default. Present the proposal to the user, let them confirm or override, then write the confirmed result to `docs/agents/domain-docs.md`.

**Config file format** (`docs/agents/domain-docs.md`) — illustrative schema only, names below are placeholders, not defaults:

```markdown
# Domain docs config

Files generated per domain by /kipi, written to `<domain>/docs/`.

## <filename-1>.md
Sections: <section>, <section>, ...

## <filename-2>.md
Sections: <section>, <section>, ...
```

Each `##` heading is a filename generated in the domain's `docs/` folder; the `Sections:` line is that file's required section list. This shape is fully owned by the config file — this skill never overrides it at runtime.

## Project scope

Before anything else, establish which project this run is about — don't assume repo-root scope silently.

1. Check the repo's context map — root `llms.txt` (its `## Contexts` section), falling back to `CONTEXT-MAP.md` in repos that still use one. If either exists, this is a **multi-context repo**: it lists the contexts (apps/libs), each with its own `CONTEXT.md` + `docs/adr/` (per `docs/agents/domain.md`). Ask the user which project/context this run targets, unless they already named one in their argument (a path under `apps/<x>/` or `libs/<x>/` implies that context — confirm, don't just assume).
2. If neither exists, this is a **single-context repo** — one root `CONTEXT.md` + `docs/adr/` (if present) covers everything; no project question needed.

Where `llms.txt` is generated, never edit it to add or correct a context — edit that context's `CONTEXT.md` frontmatter and regenerate.
3. Once scope is set, read that project's `CONTEXT.md` in full — glossary and any recorded architectural decisions — before doing anything else. This vocabulary is mandatory for every doc this run generates: don't let a generated spec invent a term the project's glossary already defines differently.

This scope also bounds discovery (repo mode only enumerates domains inside the chosen project, never across unrelated contexts) and is the `projectContext` you carry into every domain you document below.

## Process

1. Resolve project scope (above).
2. Resolve config (further above). If this is the first run in the repo, config setup happens now, scoped to the chosen project if relevant (a design-system lib and a backend service under the same repo may want different doc shapes — ask rather than assume one config fits both, if `CONTEXT-MAP.md` suggests they differ in kind).

3. Determine mode from the user's argument:
   - A specific path → **single-domain mode**, that path is the domain.
   - `all` / "whole repo" / "every domain" / no argument at all → **repo mode**, go to step 4.
   - Ambiguous → ask which mode.

4. **Repo mode only — discovery.** Enumerate domain candidates within the resolved project scope yourself — folders that are genuine public API boundaries, using this repo's own structure docs (`FOLDER_STRUCTURE.md`, `CONTEXT-MAP.md`, workspace project lists) rather than blind pattern-matching.

   Present the discovered list to the user before writing anything — repo-wide generation is expensive (real source-reading per domain) and a bad discovery pass silently produces junk docs across the whole tree. Let them add/remove entries. Do not proceed until confirmed.

5. For each domain (single-domain mode: the one domain; repo mode: the confirmed list, taken **one at a time, in order**), check whether `<domain>/docs/` already exists (refresh) or not (first generation).

6. For each domain in turn: read that domain's full source yourself, then write its `docs/` folder using:
   - `docFiles` — the resolved config's file → sections list, verbatim
   - `crossDomainContext` — the resolved project's `CONTEXT.md` (glossary + ADRs) — always apply this, not just when convenient; it's what keeps terminology consistent across every domain in the project
   - `refresh` — whether `docs/` already existed for this domain

   Finish one domain's docs completely — read its source, write its files, note any `TODO: confirm intent` markers — before moving to the next domain. Never blend two domains' source into one read-and-write pass; that's how output goes shallow and generic.

7. Relay results to the user: per domain, which files were written/updated and any `TODO: confirm intent` markers left for them to fill in. In repo mode, summarize as a table (domain → files → TODO count) rather than repeating the full detail for every domain.

## Boundaries

- Never operate repo-wide without resolving project scope first in a multi-context repo — a domain in one project must never absorb another project's glossary or ADRs.
- This skill never names or assumes doc files/sections — that's `docs/agents/domain-docs.md`'s sole responsibility, sourced from the repo itself on first run.
- One domain fully finished before the next, always — even in repo mode, never let a single pass span multiple domains; that produces shallow, generic docs. Working domains one at a time, in order, is how repo mode stays specific.
- Never overwrite `docs/adr/` or `CONTEXT.md` — those are cross-domain and owned by `/domain-modeling`.
- This skill documents what exists. It does not design new APIs or make architectural decisions — that's `/to-spec` (new work) or `/domain-modeling` (cross-domain decisions).
- Repo mode never runs undiscovered/unconfirmed — always show the domain list and wait for confirmation first.
