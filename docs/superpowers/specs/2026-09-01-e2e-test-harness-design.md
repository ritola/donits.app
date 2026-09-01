# BDD black-box E2E test harness (design)

## Status

Approved for implementation.

## Problem

The repo has no automated tests. We want a black-box, BDD-style test
harness for `apps/desktop` that exercises as much of the real
application as possible — real Vite frontend, real backend process,
real WebSocket RPC, real `isomorphic-git` — and fakes only the parts
that are genuinely external services (GitHub, the git remote) or
genuinely unsafe to touch in an automated run (the developer's OS
keychain and app settings).

The first concrete deliverable is one example scenario: connecting to
a GitHub repository for the first time (the "happy path login" flow),
covering GitHub device-flow auth through to a successful clone shown
in the UI.

## Scope

In scope:
- A reusable e2e harness under `apps/desktop/tests/e2e/`.
- Small, env-gated test seams in three existing backend files so the
  harness can isolate GitHub, git-remote, settings, and secret storage
  without touching the developer's real data.
- One example scenario: first-time repository connect (happy path).

Out of scope (not built now, harness should not preclude adding later):
- Testing the native desktop webview shell (Deno's webview backend has
  no known automation tooling yet; the browser dev server is the
  black-box boundary for now).
- Non-happy-path scenarios (auth denial/timeout, clone failure, no
  network, etc.) — the DSL and fakes are structured so these can be
  added as further scenarios without redesign, but only the happy path
  is implemented here.
- Parallel test execution / dynamic port allocation — ports are fixed
  (5173, 6879) and the harness assumes scenarios run serially, matching
  the app's current hardcoded ports.

## Architecture

```
Deno.test (BDD-style given/when/then)
  -> Playwright (Chromium, headless) navigates http://localhost:5173
  -> real Vite dev server
  -> real WebSocket RPC (ws://localhost:6879/rpc)
  -> real backend process (server.ts / backend.ts)
       -> fake GitHub server (local HTTP, stands in for github.com)
       -> real isomorphic-git clone
            -> fake git-smart-HTTP fixture server (local, serves a bare repo)
       -> settings + secret storage redirected to a temp dir / in-memory
          store via env vars, instead of the real OS locations
```

Only the GitHub API and the git remote are faked as external services.
Settings and secret storage are redirected (not behaviorally faked) so
the app's own persistence code still runs, just against disposable
locations.

## Components

### 1. Production seams (env-gated, default to current behavior)

- `apps/desktop/src/features/git/backend.ts`: replace the hardcoded
  `https://github.com/...` URLs with a `GITHUB_BASE_URL` constant read
  from `Deno.env.get('DONITS_GITHUB_BASE_URL') ?? 'https://github.com'`.
- `apps/desktop/src/lib/backend/settings.ts`: `getConfigDir` honors
  `Deno.env.get('DONITS_CONFIG_DIR')` before falling back to the
  per-OS app-support path.
- `apps/desktop/src/lib/backend/secureStorage.ts`: when
  `Deno.env.get('DONITS_SECRET_STORE') === 'memory'`, use an in-memory
  `Map`-backed store instead of `@napi-rs/keyring`.

None of these change default behavior when the env vars are unset —
the app running normally is unaffected.

### 2. Test fixtures (`apps/desktop/tests/e2e/support/`)

- `fakeGitHubServer.ts` — local HTTP server implementing:
  - `POST /login/device/code` → returns a device code payload.
  - `POST /login/oauth/access_token` → returns `access_token` on the
    happy path (no pending/denied states needed yet; structured so a
    later scenario can add them).
- `gitFixtureServer.ts` — creates a temp bare repo (`git init --bare`,
  one fixture commit pushed into it), serves it over smart HTTP by
  spawning `git http-backend` as CGI per request. Requires the `git`
  CLI to be present (already a repo/dev prerequisite; not shipped in
  the app itself).
- `testApp.ts` — orchestrates one scenario run: sets the env vars
  above to point at temp dirs / fakes, starts the backend
  (`startServer()` from `server.ts`) and the Vite dev server, launches
  Playwright, and tears everything down (including temp dirs) in a
  `finally`.
- `bdd.ts` — `scenario(name, fn)`, `given`, `when`, `then`, `and`: thin
  labeled wrappers over `Deno.test`'s `t.step`, purely for readable
  step output. No Gherkin parsing.

### 3. Example scenario (`apps/desktop/tests/e2e/connect-repository.e2e.ts`)

**Connecting to a GitHub repository for the first time**
- Given no GitHub account is connected yet
- And a repository is reachable at a URL
- When the user enters that URL and completes GitHub authorization
- Then the app shows it's connected to that repository, with its
  branches loaded

### 4. Running the harness

- New deno task in `apps/desktop/deno.json`, e.g. `test:e2e`, running
  `deno test -A tests/e2e/`.
- One-time local setup note: Playwright's Chromium binary needs to be
  installed (`deno run -A npm:playwright install chromium`) — documented
  in the harness's own README, not automated as part of every test run.

## Error handling

- If the backend or Vite process fails to start, the test fails fast
  with the process's stderr surfaced, not a generic timeout.
- `testApp.ts` tears down backend/Vite processes and temp directories
  in a `finally` block so a failing assertion doesn't leak processes
  or leftover files between runs.
- Playwright runs headless with a reasonable navigation/action timeout
  so a hung UI fails the test rather than hanging CI indefinitely.

## Testing

The harness's own correctness is demonstrated by the example scenario
passing against the real app. No separate unit tests are planned for
the fakes/support code at this stage — they're thin enough that the
e2e scenario is the test.
