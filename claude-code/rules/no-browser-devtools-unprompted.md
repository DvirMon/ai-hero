# Never drive browser devtools unprompted

Never call the claude-in-chrome (or any browser) MCP tools
unless the user explicitly asks, or has enforced it for the
task. When a browser check *is* warranted, run it **once,
after the code is finished**, with every assertion batched
into a single evaluate — not incrementally while working.

**Why:** during a story-host migration I called chrome-devtools
~12 times. The user had asked for exactly one check; the rest
was me verifying tri-state, sort glyphs and three refetch
branches step by step. Called out directly: "never call
devtools without me explicitly telling you that... you called
it 10 times instead of calling it once and do the tests."
Each call is a round trip through the user's own browser.

**How to apply:** treat it like
[[never-run-build-serve-test-unprompted]] — same family, same
default. Write the code, run the cheap static checks
(`nx run <project>:typecheck`), then say what is worth
verifying and stop. If the user asked for a browser check,
scope it to what they asked and no more. If a broader check is
genuinely needed, collect every assertion into one script, run
it once at the end, then report. Do not explore, poll, or
re-navigate to confirm things the user did not ask about.
