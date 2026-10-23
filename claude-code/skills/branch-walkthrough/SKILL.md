---
name: branch-walkthrough
description: Guided, step-by-step tour of the changes on a branch for a developer new to the codebase — starts with a high-level system overview, then walks one flow segment per turn, explaining why each changed file was touched and linking the relevant docs pages, stories, screenshots or snapshots at every step. Use when someone says "help me understand the changes in this branch", "walk me through this branch/PR", "why was each file changed", "I'm new, explain how X works and how this branch changes it", or asks to go through a feature flow "step by step".
argument-hint: "Topic or flow to start from (e.g. 'how a license is generated')"
---

# Branch walkthrough

A tour, not a report. The reader is new to the codebase. Never explain the whole flow in one
answer — one stop per turn, then wait.

## 0. Prepare (silent — don't narrate this)

1. **Base.** `git merge-base HEAD origin/main` (fall back to `main`/`master`). All diffs are
   `<base>...HEAD`.
2. **Changed files.** `git diff --stat <base>...HEAD` and `git log --oneline <base>..HEAD`.
3. **Existing docs first, code second.** Read, in order, whatever exists: PR body and linked
   issue (`gh pr view`, `gh issue view`), root and domain `CLAUDE.md` / `AGENTS.md` /
   `.cursor/rules`, `docs/` folders next to the changed code, ADRs, READMEs. The docs say what
   the change is *for*; the diff only says what moved.
4. **Visual references.** Find what the reader can look at: Storybook stories (`*.stories.*`)
   for changed components, test snapshots (`__snapshots__/`, `*.snap`), screenshots or images
   in `docs/` or the PR body, route paths for changed pages.
5. **Build the tour.** Group changed files into flow segments along the runtime path (e.g.
   data/model → service/API → state → UI → wiring/config → tests). Order stops so each one only
   depends on stops already visited. Every changed file belongs to exactly one stop.

Do not run builds, dev servers, installs or tests to prepare. Read-only commands only.

## 1. First turn: overview + map

- **System in 5-8 short lines:** the parts involved and how they talk to each other. A small
  ASCII diagram if it helps (boxes and arrows, no more than ~8 nodes).
- **What this branch is for:** 1-2 lines, quoted or cited from the PR/issue/docs.
- **Tour map:** the numbered list of stops, one line each, no detail. Mark stop 1 as current.
- **Links** (see §3).
- End with: the next stop's name, and an invitation to ask questions or jump elsewhere.

No file-by-file detail yet.

## 2. Each later turn: one stop

```
## Stop N/M — <segment name>

What happens here      <2-4 lines, plain language>
Before this branch     <1-2 lines: old behavior, or "did not exist">
What changed and why   per file in this stop:
  - path/to/file.ts:42 — <what changed> → <why: the need it serves>
How it connects        <1 line: what calls this, what it calls next>
Look at                <links: docs, story, snapshot, screenshot>

Next: Stop N+1 — <name>. Or ask about anything above.
```

- **Why over what.** Tie each change to the goal from the PR/issue/docs. If no source says
  why, say "reason not documented — likely <guess>", marked as a guess.
- Show at most one short code excerpt per stop (≤ 15 lines), only the lines that matter.
- Explain a term the first time it appears (one clause). Plain verbs, short sentences — the
  reader may not be a native English speaker.
- Small files that only follow from another change (barrel export, type tweak, test update)
  get one line each, grouped at the end of their stop.
- If the reader asks a question, answer it first, briefly, then resume the tour.
- If the reader wants to jump ahead, go there and update the map's "current" marker.

## 3. Links — every turn

Every stop links what the reader should open next to the explanation:

- **Code:** `path/to/file.ts:LINE` — relative to repo root, pointing at the changed hunk.
- **Docs:** the specific doc page/section, not the folder.
- **UI:** Storybook story path (`<title>/<StoryName>` and, if the project documents its port,
  the URL `http://localhost:<port>/?path=/story/<story-id>`), app route, or screenshot path.
- **Snapshots:** the snapshot file and the test name that produces it.
- **Commit:** the short SHA that introduced the change, when commits are clean.

Only link things that exist — check the path first. Never invent a URL or story id.
If nothing visual exists for a stop, say so in one line.

## 4. Last stop

- **Coverage check:** list any changed file not explained at a stop. Must be empty — if not,
  explain those files now.
- **Recap:** the full flow in 5-8 lines, end to end, now that the reader has seen each part.
- **Where to go next:** 2-3 files or docs worth reading on their own.

## Don'ts

- Don't dump the whole flow, all files, or the full diff in one answer.
- Don't edit code or docs during the tour unless asked.
- Don't restate long doc sections — link them and summarize in a line.
- Don't run build/serve/test to "show" behavior; point at the story, snapshot or screenshot.
