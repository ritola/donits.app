import { assertEquals } from '@std/assert'
import { startFakeGitHubServer } from './fakeGitHubServer.ts'

Deno.test({
  name: 'fake GitHub server returns a device code payload',
  fn: async () => {
    const server = await startFakeGitHubServer()

    try {
      const res = await fetch(`${server.url}/login/device/code`, {
        method: 'POST',
      })
      const payload = await res.json()

      assertEquals(res.status, 200)
      assertEquals(typeof payload.device_code, 'string')
      assertEquals(typeof payload.user_code, 'string')
      assertEquals(typeof payload.verification_uri, 'string')
      assertEquals(typeof payload.expires_in, 'number')
      assertEquals(typeof payload.interval, 'number')
    } finally {
      await server.close()
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
})

Deno.test({
  name: 'fake GitHub server returns the configured access token',
  fn: async () => {
    const server = await startFakeGitHubServer({
      accessToken: 'test-token-123',
    })

    try {
      const res = await fetch(`${server.url}/login/oauth/access_token`, {
        method: 'POST',
      })
      const payload = await res.json()

      assertEquals(res.status, 200)
      assertEquals(payload.access_token, 'test-token-123')
    } finally {
      await server.close()
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
})
