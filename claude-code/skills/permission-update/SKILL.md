---
name: permission-update
description: Review the Bash commands run in the current session, find the ones not yet covered by an allow rule (i.e. the ones that would prompt), and add them to the right settings.json so Claude Code stops asking for them.
disable-model-invocation: true
---

# Permission Update

Triggered explicitly by the user (e.g. `/permission-update`) at the end of a session that had a lot of Bash permission prompts, to bulk-allow the safe, repeated ones.

## Steps

1. **Find the current session's transcript.** It lives at:
   `~/.claude/projects/<escaped-cwd>/<session-id>.jsonl`
   where `<escaped-cwd>` is the working directory with `/` replaced by `-`. The `<session-id>` is the `sessionId` field inside the transcript itself — it also appears as a path segment in the scratchpad directory path given in your system prompt (`.../<escaped-cwd>/<session-id>/scratchpad`), which is the fastest way to identify it without guessing.

2. **Extract every distinct Bash command run this session**, in order of first use:

   ```bash
   python3 -c "
   import json
   path = '<transcript path>'
   cmds = []
   with open(path) as f:
       for line in f:
           try: obj = json.loads(line)
           except: continue
           if obj.get('type') != 'assistant': continue
           for c in obj.get('message', {}).get('content', []) or []:
               if isinstance(c, dict) and c.get('type') == 'tool_use' and c.get('name') == 'Bash':
                   cmds.append(c['input']['command'])
   for c in dict.fromkeys(cmds): print(c)
   "
   ```

3. **Load the currently effective Bash allow rules.** Read, in this order, every file that exists:
   - `~/.claude/settings.json`
   - `~/.claude/settings.local.json`
   - `<project>/.claude/settings.json`
   - `<project>/.claude/settings.local.json`

   Collect every string under `permissions.allow` that starts with `Bash(`. These are additive across files — a command is already covered if it matches a pattern in *any* of them.

4. **Filter out commands that are already covered.** For each command from step 2, check whether it matches an existing `Bash(pattern)` (prefix match, `*` as wildcard — mirror Claude Code's own matching semantics). Drop anything that already matches; only the genuinely uncovered commands would have triggered a prompt.

5. **Generalize the remainder into rules, not literals.** Group by command family and propose one pattern per family scoped to the first one or two tokens plus a wildcard — e.g. `Bash(npm run *)`, `Bash(rtk grep *)`, `Bash(git log *)` — rather than one entry per exact command line. Keep enough of the prefix that the rule stays meaningfully scoped; don't collapse unrelated subcommands into one wildcard just because they share a binary name.

6. **Never propose auto-allow for destructive or high-blast-radius commands.** This includes (non-exhaustive): `rm -rf`, `git push --force`, `git reset --hard`, `git clean -f`, `git branch -D`, `sudo`, anything piping into a shell (`| sh`, `| bash`), or anything touching credentials/secrets. List these separately as "not auto-added — review individually" instead of silently dropping or silently allowing them.

7. **Show the user the full proposed diff before touching anything**: which new `Bash(...)` patterns, and which file they'd be added to. Default target is `<project>/.claude/settings.local.json` (personal, untracked — matches where ad hoc allow entries already accumulate). Ask if the user wants a different file (global vs project, local vs shared-with-team).

8. **Only after explicit confirmation**, edit the target file: read it, append the new entries under `permissions.allow` (creating the key/array if it doesn't exist yet), and write it back — preserve existing entries, ordering, and untouched keys (`deny`, `ask`, etc.).

9. **Report a short summary**: entries added and to which file, plus the list of destructive commands intentionally left out for manual review.

## Notes

- This only looks at the *current* session's transcript. For a retroactive sweep across many past sessions, use the built-in `fewer-permission-prompts` skill instead.
- Treat step 8 as a config change like any other — never skip the confirmation in step 7.
