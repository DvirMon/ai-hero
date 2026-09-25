# What formats do others use for implementation task files handed to a coding agent — and how do we make ours shorter without starving the executor?

**Date:** 2026-09-25 · **Depth:** standard

## Answer

- **The field agrees on five things.** Every surveyed format has a task statement, the files it
  touches, how you check it is done, dependencies, and (in the agent-era formats) what is out of
  scope. [S1][S5][S9][S14][S18][S20]
- **They disagree on where the "why" goes, and that is the decision.** Spec Kit, Kiro and BMAD
  v6.12 keep the reason in the spec and point to it from the task. [S1][S4][S7] BMAD v4 and
  OpenAI's ExecPlan copy it into the task instead. [S8][S12]
- **Our executor can already follow a link.** It receives `specPath` and `architecturePath`, and
  CLAUDE.md is loaded for it automatically. [R3][R4][S17] So "Why This Step Exists" can shrink
  to one line plus refs.
- **Cut or merge 5 of our 13 sections:**
  - Scaffolding agent and Skills used: nothing reads them. [R2][R3]
  - Parallel-safe with: `/implement` works this out from `Depends on` plus the `Files` lists. [R2]
  - Risks / Watchouts: merge into Implementation Notes as "Constraints". [S13]
  - PR scope: fold into a one-line summary.
- **Terse vs verbose.** The evidence says be specific about decisions and boundaries. It also
  says repo overviews and repeated context add cost without adding success. [S10][S15][S16][S22]

## Comparison — the summary table

| Format | Sections | Typical length | Rationale | Acceptance | Dependencies |
|---|---|---|---|---|---|
| Spec Kit `tasks.md` @v1.0.11 | One line per task: `- [ ] T014 [P] [US1] <desc> in <path>`. Each story phase has **Goal**, **Independent Test** and **Checkpoint** lines [S1] | 1 line per task [S1] | Linked. `/implement` loads plan.md (required) plus data-model, contracts and research when present [S2] | Per phase: "Independent Test" and "Checkpoint" [S1]. Tests are optional unless requested [S1] | `[P]` marks parallel. Inline "(depends on T012, T013)". Phase order blocks [S1] |
| Kiro `tasks.md` | Numbered checkbox, sub-bullet steps, then `_Requirements: 1.1, 1.5_` [S4] | Several sub-bullets [S4] | Linked, through requirement IDs [S4][S7] | EARS (`WHEN … THE SYSTEM SHALL …`) in requirements.md, not in the task [S5] | Kiro works out dependencies and runs tasks in "waves" [S3][S6] |
| Taskmaster @0.43.1 | Required: id, title, description, status. Optional: dependencies, priority, details, testStrategy, subtasks [S9] | Header fields plus free text [S9] | Inline, in `details` (optional) [S9] | `testStrategy` (optional) [S9] | `dependencies` field of IDs [S9] |
| BMAD v4.44.3 story | Status, Story, Acceptance Criteria, Tasks/Subtasks, Dev Notes (+Testing), Change Log, Dev Agent Record, QA Results. Each section has an owner [S8] | Long, on purpose [S8] | **Inline.** "the dev agent should NEVER need to read the architecture documents" [S8] | Numbered list copied from the epic [S8] | Not a field [S8] |
| BMAD v6.12.0 story | Required: `id`, `title`, `description`. The rest are optional dispatch flags [S7] | "two sentences" [S7] | **Linked.** The description points "into `SPEC.md`" [S7] | Given/When/Then, at epic level [S11] | "MUST NOT depend on future stories" [S11] |
| OpenAI ExecPlan | 12 required sections, from Purpose to Interfaces and Dependencies [S12] | Long, and it is a living document [S12] | **Inline.** "Do not point to external blogs or docs" [S12] | Observable behavior: commands and expected outputs [S12] | Section "Interfaces and Dependencies" [S12] |
| Claude Code best practices | Files and interfaces, out of scope, end-to-end verification [S14] | — | — | "a check it can run" [S14] | — |
| GitHub Copilot agent | Description, "complete acceptance criteria", "which files need to be changed" [S18] | — | — | Explicit [S18] | — |
| Devin | Context, steps, success criteria, existing patterns, verification, design choices already made [S19] | — | — | Named command plus expected result [S19] | Split into sessions [S19] |
| "Agent-ready ticket" posts | What changes, Where, Out of scope, Acceptance, Notes [S20] | "twenty lines … complex one runs forty" [S20] | In Notes, as links [S20] | Checklist [S20] | Dependency links [S21] |
| INVEST / SMART | Story qualities, not sections [S23] | Small [S23] | Negotiable, "not an explicit contract" [S23] | Testable / Measurable [S23] | Independent [S23] |
| Gherkin | Given / When / Then [S24] | "3-5 steps per example" [S24] | — | Assertion of actual vs expected [S24] | — |
| Nygard ADR | Title, Context, Decision, Status, Consequences [S13] | "one or two pages" [S13] | That is the whole point of the document [S13] | — | Status: superseded-by [S13] |
| **Ours** | 13 sections [R1][R5] | ~5 KB average, ~19 KB max (caller's figure) | Inline: "Why This Step Exists" restates architecture items and D-numbers [R5] | Checklist [R5] | Depends on + Parallel-safe with [R1] |

## Our sections, mapped to the field

| Our section | Analogue elsewhere | Who reads it here | Verdict |
|---|---|---|---|
| Title | Everywhere [S1][S7][S9] | Humans, progress.md | Keep |
| PR scope | Spec Kit phase **Goal** line [S1] | Nobody reads it by name [R2][R3] | Merge into a one-line summary under the title |
| Depends on | Spec Kit inline, Taskmaster field [S1][S9] | `/implement` [R2] | Keep; move to frontmatter |
| Parallel-safe with | Spec Kit `[P]` [S1] | `/implement` works it out from Depends on + Files [R2] | Cut: it is derived, and it can drift |
| Task type | No outside analogue. It is our routing key | `/implement` routes on it [R2] | Keep; move to frontmatter |
| Skills used | Claude Code `skills:` agent frontmatter preloads skills [S17] | The implementer loads `angular-developer` itself and never reads this field [R3] | Cut, or make it real by putting `skills:` in the agent file |
| Scaffolding agent | None | `/implement` picks the agent from Task type + stack [R2] | Cut: derived |
| Files | Spec Kit paths, Copilot, Claude Code, "Where" [S1][S18][S14][S20] | `/implement` and implementers [R2][R3] | Keep; move to frontmatter as a list |
| Why This Step Exists | ExecPlan "Purpose" [S12]; Kiro `_Requirements:_` [S4]; BMAD v6 description [S7] | `adr-writer` extracts from it [R2]; implementers do not name it [R3] | Shrink to 1-2 lines + ref links |
| What To Do | Everywhere [S1][S4][S19] | Implementers [R3] | Keep. This is the agent detail layer |
| Implementation Notes | Taskmaster `details`, BMAD Dev Notes, "Notes" [S9][S8][S20] | Implementers [R3] | Keep; rename to Constraints and absorb Risks |
| Risks / Watchouts | ADR "Consequences" [S13] | Not named by implementers [R3] | Merge into Constraints |
| Non-Goals | Out of scope [S14][S20][S21]; BMAD SPEC Non-goals [S10] | Implementers: "Anything in Non-Goals is out" [R3] | Keep. Highest-leverage section [S20] |
| Acceptance Checks | Everywhere [S1][S14][S18][S19] | Implementers report against them [R3] | Keep. Drop lines that repeat the agent's own process (see Evidence) |
| Nav links | None. Spec Kit and Kiro use one list file [S1][S4] | Humans only | Optional; `progress.md` already indexes the steps [R1] |

## Evidence

**What the executor actually gets**

- A non-fork subagent sees none of the parent conversation. It gets its system prompt, the
  task message, and every level of CLAUDE.md. [S17]
- The `skills:` agent frontmatter injects the full skill content when the agent starts. [S17]
- `angular-implementer` reads Files, What To Do, Implementation Notes, Non-Goals and
  Acceptance Checks by name. [R3]
- It loads `angular-developer` itself. [R3]
- It reads `specPath` and `architecturePath` "only if the step is ambiguous". [R3]
- It typechecks as a fixed step of its own process. [R3]
- `/implement` routes on `Task type` + `stack`. [R2]
- It runs steps in parallel only when there is no `Depends on` and the `Files` lists do not
  overlap. [R2]

**Layering patterns (a human layer and an agent layer)**

- **Machine fields in a header.** Taskmaster uses `# Task ID/Status/Dependencies/Priority`
  header lines above free-text Details. [S9] BMAD v6.12 uses YAML with 3 required fields. [S7]
- **A trace reference instead of restating.** Kiro uses `_Requirements: 1.1, 1.5_`. [S4]
  Spec Kit uses `[US1]` tags. [S1] BMAD v6.12 uses a description "pointing into `SPEC.md`". [S7]
- **Companion files declared once.** BMAD SPEC frontmatter has `companions:`, the "files
  downstream must read alongside". [S10]
- **Lightweight identifiers, loaded just in time.** Keep file paths and links in the prompt, and
  let the agent load the content when it needs it. [S15]
- **Section ownership.** BMAD v4 gives each section an owner and editors: scrum-master, dev
  agent, QA. That keeps the planner's text apart from the executor's record. [S8]
- **One index file, not per-step navigation.** Spec Kit and Kiro keep all tasks in one list. [S1][S4]

**Terse vs verbose — evidence for more specificity**

- Anthropic's lead agent first gave "simple, short instructions". Subagents then
  "misinterpreted the task or performed the exact same searches". [S16]
- Each subagent needs "an objective, an output format, guidance on the tools and sources to
  use, and clear task boundaries". [S16]
- Underspecified SWE tasks hurt agents. Letting the agent ask questions recovers performance,
  "up to 74%" over the non-interactive setting. [S25]
- Opus 5 "performs best when given the complete task specification up front and left to
  run". [S26]
- Opus 5 "can also expand the scope of a task". Anthropic's fix is an explicit scope
  statement. [S26]
- Explaining *why* a rule exists ("text-to-speech … will not know how to pronounce them") beats
  a bare rule. [S27]
- In agent-ready tickets, the out-of-scope list is "the single highest-leverage section". [S20]

**Terse vs verbose — evidence for less volume**

- Context files (AGENTS.md) did not raise success. They raised cost by about 20% (v2: +20-23%
  for LLM-written, up to +19% for developer-written). [S22]
- In the same study, repo overviews are "not helpful". Files should "only contain specific
  additional instructions beyond what is already available in the codebase". [S22]
- On LongMemEval, focused ~300-token prompts scored "significantly higher" than full ~113k-token
  prompts, across all model families. [S28]
- "Bloated CLAUDE.md files cause Claude to ignore your actual instructions." The test for each
  line: "Would removing this cause Claude to make mistakes?" [S14]
- On Opus 5, explicit verification instructions "cause over-verification". Removing them saves
  tokens "with no loss in quality". [S26]
- Spec-driven workflows turned a small bug into "4 'user stories' with a total of 16 acceptance
  criteria". [S29]
- The same review: "I'd rather review code than all these markdown files". [S29]
- An agent ignored notes that described existing classes and generated them again as
  duplicates. [S29]

**Classic formats worth borrowing**

- Gherkin: 3-5 steps per example; beyond that it "lose[s] its expressive power". [S24]
- ADR: "one or two pages". Consequences are listed positive, negative and neutral. [S13]
- SMART tasks: Specific, Measurable, Achievable, Relevant, Time-boxed. [S23]

## Synthesis

- **Rationale: linked vs inline.** Spec Kit, Kiro and BMAD v6.12 link. [S2][S4][S7] BMAD v4
  and ExecPlan inline, and ExecPlan forbids external links outright. [S8][S12]
  - The split follows **whether the executor can reach the spec.** ExecPlan targets "a
    complete novice … without prior knowledge of this repo". [S12] BMAD v4 wanted the dev
    agent never to open architecture docs. [S8]
  - Our executor receives spec and architecture paths and CLAUDE.md. [R2][R3][S17] That puts
    us on the linking side.
  - **BMAD itself moved from inline (v4) to linked (v6.12).** It is the only surveyed project
    with both shapes on record. [S7][S8]
- **Specificity vs volume.** The two evidence groups above look opposed, but they measure
  different things.
  - The "more" side is about *missing decisions and boundaries*: vague objective, no scope,
    open design choices. [S16][S25][S26]
  - The "less" side is about *orientation text the agent can get elsewhere*: overviews,
    repeated conventions, repeated verification rules. [S22][S14][S26]
  - For a step file: keep every decision, every constraint and every out-of-scope line. Cut
    restated architecture and anything CLAUDE.md or the agent's own body already says.
- **The "why" still earns one clause per constraint.** [S27] What goes is the separate "why
  this step exists" essay that re-tells the architecture doc. [R5] Keep "no `ngDevMode` gating
  — must fire in production". Drop the paragraph that restates settled items 4 and 8.
- **Dependencies: explicit vs derived.** Kiro derives them [S6]. Spec Kit writes them inline
  [S1]. Taskmaster uses a field [S9]. We write `Parallel-safe with` by hand, but `/implement`
  already derives it [R2]. That is two hand-kept copies of one fact.
- **Acceptance.** Every agent-era source makes it a pass/fail check. [S14][S18][S19] Opus 5
  guidance argues against also telling the agent *how* to verify when its harness already
  does. [S26] Our example's last check ("`tsc --noEmit` … passes") repeats
  `angular-implementer` step 7. [R3][R5]

A proposed skim-first shape, derived from the above (it is not copied from any one source):

```markdown
---
step: 2
title: withComputed()
type: code
depends: [1]
files:
  - libs/table/src/api/features/with-computed.ts (new)
  - libs/table/src/index.ts (edit)
refs: [architecture.md#settled-4, D28, ADR-0014]
---
# Step 2 — withComputed()

> **Does:** adds `withComputed(block)` and its export. **Why:** a derive block is a
> feature (architecture settled item 4). **Done when:** the checks below pass.

## Do
## Constraints        ← Implementation Notes + Risks/Watchouts, one reason-clause each
## Out of scope
## Done when
```

## Against

- **Linking costs the agent a read, and it may skip it.** `angular-implementer` opens the spec
  only "if the step is ambiguous". [R3] Our own rule tells the agent to avoid reading the spec.
  If a rationale line is needed to pick between two readings, a link alone may not be enough.
- **ExecPlan's full self-containment is a considered position.** OpenAI chose it for multi-hour
  runs, and it forbids links. [S12]
- **Opus 5 "performs best when given the complete task specification up front".** [S26] Cutting
  too far fails too. Ambig-SWE puts a number on the cost of underspecification. [S25]
- **Section owners (BMAD v4) help humans skim a document that several roles edit.** [S8] Our
  single-author step files may not need that.

## Not researched

- Factory (Droids / spec mode), Windsurf, Amp, Sweep — no task-brief docs were opened.
- Cline plan mode and Roo Code task handoff. The Cline `new_task` docs page returned 404, so
  only the Memory Bank page was read. The Memory Bank is shared project context across
  sessions, not a task format, so it is not in the table.
- Any controlled study of step-file length specifically. None was found. The length evidence
  covers context files and prompts. [S22][S28]
- Our own corpus: how often implementers returned `blocked`, or broke a Non-Goal, per
  step-file length. That would be the direct test.

## Unverified

- **Kiro `tasks.md` exact syntax.** Kiro's own docs pages (feature-specs, requirements-first)
  show no task example. The format comes from a community steering file [S4], and it matches
  Böckeler's description ("trace back to the requirement numbers") [S3]. To confirm, open a
  Kiro-generated spec.
- **Cursor plan-mode file contents.** The docs say plans are editable Markdown saved to the home
  directory, but they do not list sections. [S30]
- **Devin page date.** Not shown on the page. [S19]
- **Date of the tacoda "agent ticket" post.** The fetcher reported "June 2", with the year
  unclear. [S20]
- **Atlassian's 83% vs 6% "agent-ready" figure** is an LLM judge scoring ticket *text*. It does
  not measure agent success rate. [S21]
- **Context-rot results** are measured at 10^4-10^5 tokens. A 5-19 KB step file (about 1.3k-5k
  tokens) is far below that. So per-file length is likely **not** the agent-side risk, and the
  case for cutting rests on the human skim cost plus the duplication findings. This is an
  inference, not a measured result. [S28]
- **AGENTS.md study numbers changed between versions.** Search snippets for v1 said −3% / +4%.
  v2 (read directly) says −0.5% to −2% and +2.4%, none statistically significant. The v2 numbers
  are used here. [S22]

## Sources

| | Source | Version | Verified |
|---|---|---|---|
| S1 | https://raw.githubusercontent.com/github/spec-kit/v1.0.11/templates/tasks-template.md | v1.0.11 (latest release, 2026-09-24) | yes — template read; the fetcher's line-count estimate was discarded |
| S2 | https://raw.githubusercontent.com/github/spec-kit/v1.0.11/templates/commands/implement.md | v1.0.11 | yes — confirms rationale is loaded from plan.md, not the task line |
| S3 | https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html | 2025-10-15 | yes — page read |
| S4 | https://github.com/cremich/promptz.lib/blob/main/steering/kiro-specs.md | main (unpinned) | yes — community steering file, not a Kiro doc; the only verbatim task example found |
| S5 | https://kiro.dev/docs/specs/feature-specs/ | page updated 2026-08-04 | yes — EARS format confirmed; no task example on the page |
| S6 | https://kiro.dev/docs/specs/best-practices/ | updated 2026-09-25 | yes — "waves" of independent tasks |
| S7 | https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v6.12.0/src/bmm-skills/plan/bmad-spec/assets/stories-schema.md | v6.12.0 (latest, 2026-09-04) | yes — read; showed that v6 dropped the fat v4 story file |
| S8 | https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v4.44.3/bmad-core/templates/story-tmpl.yaml | v4.44.3 | yes — read |
| S9 | https://raw.githubusercontent.com/eyaltoledano/claude-task-master/task-master-ai%400.43.1/docs/task-structure.md | task-master-ai@0.43.1 | yes — read at tag; same as main |
| S10 | https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v6.12.0/src/bmm-skills/plan/bmad-spec/assets/spec-template.md | v6.12.0 | yes — read |
| S11 | https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v6.12.0/src/bmm-skills/plan/bmad-create-epics-and-stories/steps/step-03-create-stories.md | v6.12.0 | yes — read |
| S12 | https://developers.openai.com/cookbook/articles/codex_exec_plans | undated | yes — page read (redirected from cookbook.openai.com) |
| S13 | https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions | 2011-11-15 | yes — read |
| S14 | https://code.claude.com/docs/en/best-practices | live, 2026-09-25 | yes — read in full (redirected from anthropic.com/engineering) |
| S15 | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | 2025-09-29 | yes — read |
| S16 | https://www.anthropic.com/engineering/multi-agent-research-system | 2025-06-13 | yes — the "Teach the orchestrator how to delegate" paragraph, quoted |
| S17 | https://code.claude.com/docs/en/sub-agents | live, 2026-09-25 | yes — subagent initial context; `skills` field |
| S18 | https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results | live, 2026-09-25 | yes — read |
| S19 | https://docs.devin.ai/essential-guidelines/instructing-devin-effectively | undated | yes — read |
| S20 | https://dev.to/tacoda/how-to-write-a-ticket-an-agent-can-act-on-52ic | year unclear | yes — read; the date is unconfirmed |
| S21 | https://www.atlassian.com/blog/jira/writing-tickets-for-ai-agents | 2026-08-09 | yes — read; the method (LLM judge, n=300) changes how to read the 83% figure |
| S22 | https://arxiv.org/html/2602.11988v2 | v2, 2026-06-23 | yes — read; numbers differ from the v1 search snippets |
| S23 | https://xp123.com/invest-in-good-stories-and-smart-tasks/ | 2003-08-17 | yes — read |
| S24 | https://cucumber.io/docs/gherkin/reference/ | no version shown | yes — read |
| S25 | https://arxiv.org/abs/2502.13069 | v3, 2026-02-21 (ICLR 2026) | yes — abstract read |
| S26 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5 | live, 2026-09-25 | yes — read in full |
| S27 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices | live, 2026-09-25 | yes — "Add context to improve performance" section |
| S28 | https://www.trychroma.com/research/context-rot | 2025-07-14 | yes — read |
| S29 | https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html | 2025-10-15 | yes — same page as S3, cited separately for the critique quotes |
| S30 | https://cursor.com/docs/agent/planning | undated | yes — read; it lists no plan sections |
| R1 | C:\Users\dmena\.claude\skills\to-tasks\SKILL.md:51 | — | yes — read (the current section list) |
| R2 | C:\Users\dmena\.claude\skills\implement\SKILL.md:77 | — | yes — read; routing on Task type + stack, parallelism rule at :144 |
| R3 | C:\Users\dmena\.claude\agents\angular-implementer.md:34 | — | yes — read; sections read by name, skill self-load at :23, typecheck at :44 |
| R4 | C:\Users\dmena\.claude\agents\react-implementer.md:29 | — | yes — grep; same section list as R3 |
| R5 | C:\Users\dmena\git\ng-table\libs\table\docs\1-state\work\core\archive\computed-state-mechanism\docs\tasks\issue-36-with-computed\step-2-with-computed.plan.md | — | yes — read as the representative sample |
