import { assertEquals } from '@std/assert'
import { startFakeGitHubServer } from './fakeGitHubServer.ts'
import { startTestApp } from './testApp.ts'

Deno.test({
  name: 'test app starts the dev server and serves a usable page',
  fn: async () => {
    const fakeGitHub = await startFakeGitHubServer()
    const app = await startTestApp({ githubBaseUrl: fakeGitHub.url })

    try {
      const page = await app.newPage()
      const response = await page.goto(app.frontendUrl)

      assertEquals(response?.ok(), true)
      await page.getByText('donits.app').waitFor({ timeout: 15_000 })
      await page.close()
    } finally {
      await app.close()
      await fakeGitHub.close()
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
})
