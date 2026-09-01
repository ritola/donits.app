import { and, given, scenario, then, when } from './support/bdd.ts'
import { startFakeGitHubServer } from './support/fakeGitHubServer.ts'
import { startGitFixtureServer } from './support/gitFixtureServer.ts'
import { startTestApp } from './support/testApp.ts'

scenario(
  'Connecting to a GitHub repository for the first time',
  async (t) => {
    const fakeGitHub = await startFakeGitHubServer()
    const gitFixture = await startGitFixtureServer()
    const app = await startTestApp({ githubBaseUrl: fakeGitHub.url })
    const page = await app.newPage()

    try {
      await given(t, 'no GitHub account is connected yet', async () => {
        await page.goto(app.frontendUrl)
        await page.getByText('Connect to Git').waitFor({ timeout: 15_000 })
      })

      await and(t, 'a repository is reachable at a URL', () => {})

      await when(
        t,
        'the user enters that URL and completes GitHub authorization',
        async () => {
          await page.locator('.connect-repository-url-field input').fill(
            gitFixture.url,
          )
          await page.locator('md-filled-button', { hasText: 'Connect' })
            .click()
        },
      )

      await then(
        t,
        "the app shows it's connected to that repository, with its branches loaded",
        async () => {
          await page.getByText(`Connected to ${gitFixture.url}`).waitFor({
            timeout: 15_000,
          })
          await page.locator('strong', { hasText: 'main' }).waitFor({
            timeout: 15_000,
          })
          await page.getByText('example.md').waitFor({ timeout: 15_000 })
        },
      )
    } finally {
      await page.close()
      await app.close()
      await gitFixture.close()
      await fakeGitHub.close()
    }
  },
)
