---
name: code-review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/PRD asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
---

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / PRD / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

The issue tracker should have been provided to you — run `/setup-skills` if `docs/agents/issue-tracker.md` is missing.

## Process

### 1. Pin the fixed point

Whatever the user (or the calling skill) said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc.

If none was given:

- **On a feature branch** (not the default branch): default to the branch's merge-base with the remote default — `git merge-base origin/<default> HEAD`, where `<default>` comes from `git symbolic-ref --short refs/remotes/origin/HEAD`. That is the whole branch, i.e. the PR. Say which base you used. Run `git fetch origin` first if `origin/<default>` may be stale.
- **On the default branch**, or detached: ask for it.

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here — not inside two parallel sub-agents.

### 2. Identify the spec source

This repo colocates docs by domain (`CLAUDE.md` → "Docs by Responsibility"): each touched component/feature/package owns a `docs/` folder next to its source, holding `spec.md` (implementation spec), `narrative.md` (design intent), `decisions.md` (local decisions + ADR links). Treat these as the primary spec source, ahead of a central ticket.

DS-pipeline components (built via `ds-wayfinder`) use the same roles under different filenames — `docs/prd.md` is that domain's `spec.md`, `docs/decisions.md` matches directly, and `docs/architecture.md` (complex components) matches directly. Treat `prd.md` as an alias for `spec.md` wherever it's found; there's no DS equivalent of `narrative.md`, skip it for those domains.

1. For each file touched in the diff, walk up from it to the nearest ancestor `docs/` folder that contains `spec.md`/`prd.md`/`narrative.md`/`decisions.md`. Collect the distinct set of domain doc folders hit by the diff.
2. Issue references in the commit messages (`#123`, `Refs: #45`, `Closes #45`, `Ships: #45`, GitLab `!67`, etc.) and, when the branch already has a PR, its body's `Closes #N` (`gh pr view --json body`) — fetch via the workflow in `docs/agents/issue-tracker.md`.
3. A path the user passed as an argument.
4. A PRD/spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature, if no domain docs were found in step 1.
5. If nothing is found in any of the above, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

A diff can span multiple domains — collect one doc set per domain folder, don't just take the first match.

### 3. Identify the standards sources

Anything in the repo that documents how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`. Also check `.claude/rules/*.md` (repo-local) and `~/.claude/hook-content/*.md` (global, user-level — injected by this harness's PreToolUse hook on every Edit/Write, not repo-scoped) — this harness's own convention for storing coding rules (e.g. file-organization, extraction/SRP heuristics, declarative-naming) — and include any that match the diffed files' globs. Read the global path explicitly; sub-agents spawned in step 4 don't get the hook injection themselves, so these rules must be pasted into their prompt in step 4, same as any repo-local standard.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Spawn both sub-agents in parallel

Send a single message with two `Agent` tool calls. Use the `general-purpose` subagent for both.

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- Per domain hit in step 2: the folder path, plus the full contents of its `spec.md` (or `prd.md` for DS-pipeline domains — same role), `narrative.md`, `decisions.md` (whichever exist) — these are the authoritative source of what that domain/component is supposed to do and why, ranked above any central ticket for that domain's own files.
- Any fetched ticket/PRD contents from step 2's fallback paths, labelled as such.
- The brief: "Report, grouped by domain where more than one is touched: (a) requirements from spec.md/narrative.md/decisions.md (or the ticket, where no domain docs exist) that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep), including anything that contradicts a documented decision in decisions.md; (c) requirements that look implemented but where the implementation looks wrong or diverges from narrative.md's stated intent. Quote the doc line for each finding. Under 400 words."

If no domain docs and no ticket/PRD are found for a touched area, skip the Spec sub-agent for that area and note it as "no spec available" in the final report.

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the two axes are deliberately separate (see _Why two axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
