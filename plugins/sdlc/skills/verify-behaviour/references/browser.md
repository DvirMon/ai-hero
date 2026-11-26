# Browser notes

How `/verify-behaviour` § 5 drives the browser named in `stages.verify-behaviour.browser`.
Never Playwright, in any form — not as a fallback, not for one check.

## ego-browser (default)

- Load the `ego-browser` skill and run `ego-browser skill` once per run; follow the guide it
  prints for the installed version. Its API is the source of truth for every call below.
- One task space per run. Reuse it for every case; never open one per case.
- `ui:` lines: read the ARIA state from the page (`page.evaluate`, or the guide's accessibility
  snapshot) — `role "name" [state]`, compared with the check line.
- Screenshots go under `.pipeline/verify/<branch, / → ->/`, named `c<N>-<step>.png`.
- Never clear the profile's cookies, cache or storage: the profile is shared with the
  developer's own tabs. Read `references/clearing-state.md` of `ego-browser` before any clear;
  sign-out by the app's own "Sign out" control instead.

## net: and console: lines

At run start, try once: `page.cdp("Network.enable")` and `page.cdp("Runtime.enable")`, then
confirm a request and a console message can be read back. Either cannot → run those lines
through Chrome DevTools MCP (`list_network_requests`, `get_network_request`,
`list_console_messages`) on the same flow, and say so in `verify.md`'s `Browser:` line. Never
fall back to Playwright.

## chrome

`stages.verify-behaviour.browser: "chrome"` → Chrome DevTools MCP for the whole run: snapshot
for `ui:`, network and console tools for `net:` and `console:`. Same screenshot path.

## Logins

Sign in per `stages.verify-behaviour.logins[].signIn` for the case's role. Read the credential
from where `credential` points; never print it, never write it to `verify.md` or the Artifact.
Never type a credential into a page that is not on the project's `devUrl` host.
