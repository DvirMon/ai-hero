<!-- Shared contract. Cited by to-ticket, grill-with-docs, to-spec, to-issues, to-tasks,
     implement and ship. Edit here, never restate in a skill body. -->

# Workspace file writes go to a writer agent

Every pipeline skill writes JSON and Markdown files: `state.json`, `1-decisions.md`, a
capability's decisions log, `2-spec.md`, `3-architecture.md`, `issue-graph.md`, local issue
drafts, `<workspaceRoot>/tasks/` step files (or `.cursor/plans/<slug>/` when no workspace),
`progress.md`. **None of those writes run inline in the main
session.** Dispatch them to a writer agent.

**Why:** multi-file doc edits are many reads and edits whose tool-call noise the dispatcher
does not need to hold. Its context should stay free for the conversation, the tracker calls,
and the final report. Mid-discussion, an inline write also blocks the user
(`~/.claude/rules/fork-doc-writes-during-discussion.md`).

## Which agent, which model

`Agent` with `subagent_type: "general-purpose"` and an explicit `model`. **Not a fork** — a
fork always runs on the parent's model and ignores `model`. Pick the model by what the writer
has to decide:

| Model | When | Examples |
|---|---|---|
| `haiku` | **Mechanical.** The brief holds the exact final content or the exact edit; the writer decides nothing. | set `state.json` fields; append a pre-written decision line or log row; flip a `progress.md` status; write a file whose full text is in the brief |
| `sonnet` | **Shaping.** The writer must fit content into existing structure or derive part of it. | rewrite `issue-graph.md` (rows, ASCII graph, summary) from tracker data; merge an edit into existing prose; render step files from an approved outline |

When unsure, use `sonnet`. A run whose writes span both kinds goes to one `sonnet` writer —
don't split one run's files across two agents to save cost.

**Exception — `/impel`'s `docs`/`chore` steps stay on a fork.** Those write from a step
file and need the earlier steps' diffs, which only an inherited context carries.

## The brief must be self-contained

The writer starts with **no conversation context**. Whatever it isn't told, it will guess.
Every brief carries:

1. **Target paths**, absolute.
2. **The content** — final text verbatim, or the exact edit (old → new, field → value). You
   already hold it; hand it over rather than describing it.
3. **The governing contract** for each file — `state-schema.md`'s validation routine for
   `state.json` (preserve sibling keys, bump `updatedAt`), `doc-contracts/decisions-log.md`
   for a capability log, the calling skill's template for everything else. Give the path; the
   writer reads it.
4. **What to report back:** each file written, and anything it could not do.

A thin brief is the failure mode this mechanism introduces. If writing the brief takes as long
as the edit, the brief is still required — the edit stays off the main session.

## Mechanism

1. **Spawn the writer** in the background. Name it after the run, e.g. `<slug>-spec-writes`.
2. **One writer per file.** A later write to a file a writer already owns, in the same run,
   resumes that writer with `SendMessage` — never a second agent. Two writers editing one file
   race and clobber each other.
3. **Keep working.** Don't idle on the writer. Continue with whatever does not read its
   output: the next interview question, the tracker search, drafting the next section.
4. **Join before anything that depends on the files.** Wait for the writer's report before:
   - a step that reads a file the writer wrote;
   - a step whose claim is "the file exists" (e.g. `/to-tasks` promoting to `ready-for-agent`
     because the plan is on disk);
   - the stage's commit;
   - the final message, when it names files as written. Report what the writer says it wrote,
     not what you asked it to write.

## What stays in the main session

- **Reads and existence checks** — validating `state.json`, `/to-ticket`'s "does the
  workspace already exist" guard. The writer is only dispatched once the check has passed.
- **Tracker writes** — `gh issue create/edit`, labels, sub-issue and blocking relations. They
  are not workspace files, and the dispatcher needs their results (issue numbers) to continue.
  A temporary `--body-file` in the scratchpad is part of that call, not a workspace write.
- **Commits.** A stage's commit runs in the main session, after joining its writer, staging
  only the paths the stage wrote (`git add <paths>`, never `-A`). The writer never commits —
  it cannot know which sibling writes belong in the same commit.
- **Skills with their own writer** — `/domain-modeling` (ADRs, glossary) routes through its
  own agents; don't wrap it in a second writer.

Prefer a narrower specialist over the generic writer when the write is exactly that
specialist's job (`adr-writer` for one ADR).
