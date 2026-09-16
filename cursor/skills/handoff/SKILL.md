---
name: handoff
description: Write a short handoff document for a future agent session to pick up where this one left off. Triggers on "hand off", "handoff", "pass this to another session/agent", "pick this up later", ending a session with unfinished work.
argument-hint: "What will the next session be used for?"
portedFrom: bdf8b658af69
portedSelf: c2007ab3da33
---

Write a handoff document that **routes** a fresh agent session to the work. It is dispatch,
not documentation — keep it very short, usually under 15 lines.

**This produces a file for a future session, it does not start a new agent.** If the user says "hand
off to another agent/session", they mean write the document — don't start a new agent yourself.

Save it to `/tmp`, **not** the workspace, and not any session-scoped scratchpad — a scratchpad is
invisible to the fresh session this is written for, so `/tmp` overrides any scratchpad instruction
in effect. Name it `handoff-<slug>.md`. Handoffs are deleted after use; one left in the repo goes
stale and competes with the durable record for authority.

If the repo has a gitignored handoff folder (e.g. `handoffs/`), write there instead — it survives
a reboot, which `/tmp` does not. Only ever a gitignored one: a committed handoff is the stale-record
problem above, now shared with everyone.

Tell the user the path once written — a handoff nobody can locate is inert.

## Every handoff opens with a delete instruction

First line of the file, before the heading, always:

```markdown
<!-- DELETE THIS FILE once the task below is implemented and committed. It is a routing slip, not
     a record — anything worth keeping belongs in <the durable doc>, and a stale handoff left here
     competes with it for authority. -->
```

Name the actual durable doc in that comment, not the placeholder. The banner is what makes the
delete-after-use rule survive the session that wrote it: the agent picking the handoff up is the
one holding the file open when the work lands, and is the only one positioned to remove it.

## Do not summarise the conversation

Point at the artifact that already holds the content — decisions file, spec, ADR, issue, PR, diff —
by path or URL. Never restate decisions, rationale, or line-number tables that live somewhere else.

**If the handoff cannot be short, the source doc is missing context.** That is the signal to stop
and fix the source doc first, then write the short handoff — never compensate for a thin source
doc by fattening the handoff. Pick the doc by scope: cross-domain context or an ADR for decisions
spanning domains, that domain's own `docs/decisions.md` for local ones. Commit the source-doc fix
before writing the handoff.

## Include only

- **Task** — what the next agent should do, in a sentence or two.
- **Source** — path or URL to the doc holding the real content.
- **Scope** — boundaries that are not obvious from the source: which files are in play, what must
  not be touched, any part of the source doc that must *not* be applied, and any uncommitted work
  or dirty tree state the next session would otherwise inherit unwarned.
- **Suggested skills** — which skills the agent should invoke, and when.

Redact sensitive information: API keys, passwords, tokens, personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on
and tailor the doc accordingly.

## Shape

```markdown
<!-- DELETE THIS FILE once the task below is implemented and committed. It is a routing slip, not
     a record — anything worth keeping belongs in <the durable doc>, and a stale handoff left here
     competes with it for authority. -->

# Handoff — <short task name>

**Task:** <one or two sentences>

**Source:** <path or URL>

**Scope:** <files in play; what not to touch; what not to apply>

**Suggested skills:** <skill, and when to run it>
```
