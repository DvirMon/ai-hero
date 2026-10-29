---
paths:
  - "**/*.{ts,tsx,html}"
  - "**/tsconfig*.json"
---

# Typecheck through the project config, never a bare file

> **Enforced.** `hooks/command-guard.js` (PreToolUse) denies a bare `tsc <file>`.

`tsc <file.ts>` **ignores tsconfig** (no `paths`, `strict`, `lib`,
`types`). It compiles a different program than the project does; a
pass proves nothing and a failure is often a config artifact.

**Always:**

```bash
npx tsc -p <project>/tsconfig.spec.json --noEmit     # specs + everything they import
npx tsc -p <project>/tsconfig.lib.json  --noEmit     # source only
nx run <project>:typecheck                           # when the target exists — prefer it
```

Pick the tsconfig whose `include` covers the files you touched. A
spec is not in `tsconfig.lib.json`.

## Scope is set by the import graph

"Only typecheck the touched files" isn't achievable — TS pulls in the
transitive imports; in a lib one file ≈ the whole lib. Trim the
*repeat cost*, not the program.

## Output cost: filter, don't delegate

Filter at the call site:

```bash
npx tsc -p <project>/tsconfig.spec.json --noEmit 2>&1 | grep -E "error TS" | head -40
```

Don't spin up a subagent just to keep `tsc` output out of context:
implementer agents already are subagents, a clean pass is one line,
and an agent that both typechecks and fixes splits ownership of
"compiles" from the step file that defines the correct fix. Delegate
only a one-off large check from the main session (`general-purpose`).

## Repeat cost: `--incremental`

```bash
npx tsc -p <project>/tsconfig.spec.json --noEmit --incremental \
  --tsBuildInfoFile <project>/.tsbuildinfo.spec
```

Better: put `"incremental": true` + `tsBuildInfoFile` in the tsconfig —
a config change, so propose it, don't slip it into an unrelated run,
and don't run the build to prove the speedup
(`never-run-build-serve-test-unprompted.md`). Gitignore `.tsbuildinfo`.
