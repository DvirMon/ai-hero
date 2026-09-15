# Typecheck through the project config, never a bare file

`tsc <file.ts>` **ignores tsconfig entirely** — no `paths`, no `strict`, no `lib`, no `types`.
It compiles a different program than the project does, so a pass proves nothing and a failure
is often an artifact of the missing config. It is not a cheaper typecheck; it is not a
typecheck.

**Always:**

```bash
npx tsc -p <project>/tsconfig.spec.json --noEmit     # specs + everything they import
npx tsc -p <project>/tsconfig.lib.json  --noEmit     # source only
nx run <project>:typecheck                           # when the target exists — prefer it
```

Pick the tsconfig whose `include` actually covers the files you touched. A spec file is not in
`tsconfig.lib.json`; checking the lib config after writing a spec checks nothing you wrote.

## Scope is set by the import graph, not by your edit

"Only typecheck the files this step touched" is not achievable — TS pulls in the transitive
closure of imports. In a lib whose entry points reach most of the source, one file ≈ the whole
lib. Don't burn turns trying to trim the program; trim the *repeat cost* instead.

## Output cost: filter, don't delegate

A failing run emits far more than the errors — progress noise, repeated frames, the same root
cause restated per import site. Filter at the call site:

```bash
npx tsc -p <project>/tsconfig.spec.json --noEmit 2>&1 | grep -E "error TS" | head -40
```

Do **not** spin up a subagent just to keep `tsc` output out of context. Implementer agents are
already subagents — their output never reaches the main thread — and on a clean pass the
result is one line, so the spawn costs more than it saves. Worse, an agent that both
typechecks and fixes splits ownership of "write code that compiles" across two owners, and the
fixer lacks the step file that decides what the *correct* fix is. Delegate only a one-off
large-output check from the main session (full-repo, or a cold run you expect to be broken) —
`general-purpose` covers it, no dedicated agent needed.

## Repeat cost: `--incremental`

A cold run is the price of admission. Subsequent runs are ~3-5x faster with a
`.tsbuildinfo`:

```bash
npx tsc -p <project>/tsconfig.spec.json --noEmit --incremental \
  --tsBuildInfoFile <project>/.tsbuildinfo.spec
```

Better: put `"incremental": true` + a `tsBuildInfoFile` in the tsconfig so every caller gets
it. That is a config change — propose it, don't slip it into an unrelated run, and per
`never-run-build-serve-test-unprompted.md` don't run the build to prove the speedup.

`--noEmit` + `--incremental` together are supported from TS 4.0 on. Gitignore the
`.tsbuildinfo`.
