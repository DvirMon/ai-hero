---
name: source-docs
description: Bring JSDoc/`//` comments on TypeScript source to the two-channel contract in doc-contracts/jsdoc.md (consumer-facing `/** */` vs maintainer `//`) — CONTRACT CONFORMANCE is the job, then dispatches `doc-compressor` so what it wrote is also concise. Takes a path at any granularity (one file, a feature folder, a whole lib) and walks non-spec `.ts` files under it, excluding story hosts and `.stories.ts` (owned by the sdlc implementer agent on story steps, via doc-contracts/story-doc.md). Edits in place, reports a per-file comment-line delta, ends in a project typecheck. Writes no Markdown (that is `kipi`) and never verifies a claim against code (that is `audit-docs`). Use when source comments should match the JSDoc contract.
context: fork
background: false
---

# Source Docs

Rewrite comments on TypeScript source in place against one contract:
[doc-contracts/jsdoc.md](../../conventions/doc-contracts/jsdoc.md). This is the TypeScript-side
counterpart to `kipi` (markdown) and the `implementer` agent's story-doc pass on `story` steps (D24 in
`libs/shared/table`'s trim-docs plan) — same seam, different file class, different
verification. A `source-docs` run ends in a typecheck; a `kipi` run has no equivalent.

## Scope

- **In:** every non-spec `.ts`/`.tsx` file under the given path.
- **Out, always:** `*.spec.ts(x)`, story hosts (files matching `*story-host*` or living in a
  `*-story-host/` folder), `*.stories.ts(x)`. Those are owned by the `implementer` agent (on `story` steps) against
  `doc-contracts/story-doc.md` — never rewrite them here, even if asked to cover "everything."
- The path can be a single file, a feature folder (`api/features/with-sorting/`), or a whole
  lib (`libs/shared/table/src`). Walk recursively from whatever is given.

If the named path resolves to only story hosts / `.stories.ts` files, say so and stop —
nothing in scope for this skill.

## Process

### 1. Load the contract

Read `doc-contracts/jsdoc.md` in full before touching any file. It is the SSOT for both
channels — don't re-derive the budgets or the "never in either channel" list from memory.

### 2. Walk and classify each comment

For every file in scope, read it whole (not an excerpt — a comment can look decision-heavy in
isolation and turn out to be the one line explaining a real TS constraint). For each comment
block, classify by what it's attached to:

- `/** */` on an exported function, factory, or feature plugin → the entry-point channel.
- `/** */` on an options property, class field, or exported type alias → the property channel.
- `//` inside a function body → the maintainer-note channel.
- Any comment on a non-exported helper → no JSDoc owed; a `//` note is fine if it explains a
  real constraint, otherwise drop it.

### 3. Rewrite against budget

Apply `jsdoc.md`'s shape and word/line budgets per channel. Content outside the contract
("Never in either channel": decision history, D-numbers, rejected alternatives, peer-library
precedent, restating the signature) is **relocated, not deleted, if it doesn't already exist
in `docs/`** — check the domain's `docs/` folder or `docs/adr/` first. If the content is
already recorded there, cut it and, where useful, leave a bare URL. If it exists nowhere else,
that's a signal to hand off to `domain-modeling` (it may be ADR-worthy) rather than silently
drop it.

Never touch the code itself — comments only.

### 4. Compress what you wrote

Dispatch the `doc-compressor` agent over the files you just touched, passing the file list.
Conforming to the contract's shape and being concise are two different passes — step 3 places
content in the right channel, this one cuts what is still wordy inside it. The agent loads
`concise-docs` for the policy and runs its preserved-content check.

**Wait for it to report before step 5.** The dispatch returns as soon as the agent
starts, not when it finishes, and the compressor edits the same comment blocks step 5
typechecks and step 6 counts. Typechecking before it lands checks the wrong file.

Skip only when step 3 changed nothing.

### 5. Typecheck

Run the project's own typecheck target — `nx run <project>:typecheck` when one exists (see
`typecheck-with-project-config.md`), else `npx tsc -p <project>/tsconfig.lib.json --noEmit`.
Fix anything a comment edit broke (an unbalanced `*/`, a removed `@ts-expect-error` that was
load-bearing) before reporting done.

### 6. Report

```
<file>: <before-comment-lines> → <after-comment-lines> (-N%)
```

One line per file touched, then a total. The typecheck in step 5 is the only verification
this skill owns.

## Boundaries

- Never writes a `.md` file — that's `kipi`'s job, config-driven from `docs/agents/domain-docs.md`.
- Never touches story hosts or `.stories.ts` — the `implementer` agent owns those on `story` steps, against
  `doc-contracts/story-doc.md`, at the point the story is built, not after the fact.
- Not a truth-checker — this skill trims and reshapes comments to the contract; it doesn't
  verify a comment's claim is still accurate. That's `audit-docs`.
- Doesn't own concision policy — `concise-docs` does. This skill dispatches `doc-compressor`
  (step 4) rather than re-deciding what counts as cuttable.
