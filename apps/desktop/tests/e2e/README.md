# End-to-end tests

Black-box tests that drive the real app (Vite dev server, backend process, and
`isomorphic-git`) through headless Chromium. Only GitHub and the git remote are
faked, at the network boundary (`support/fakeGitHubServer.ts`,
`support/gitFixtureServer.ts`).

## One-time setup

    deno task -f desktop test:e2e:install-browsers

## Running

    deno task -f desktop test:e2e

Requires ports 5173 and 6879 to be free (stop any running
`deno task -f desktop dev` first) and the `git` CLI to be installed.
