import { assertEquals } from '@std/assert'
import { githubAccessTokenUrl, githubDeviceCodeUrl } from './backend.ts'

Deno.test('githubDeviceCodeUrl defaults to github.com', () => {
  assertEquals(githubDeviceCodeUrl(), 'https://github.com/login/device/code')
})

Deno.test('githubAccessTokenUrl defaults to github.com', () => {
  assertEquals(
    githubAccessTokenUrl(),
    'https://github.com/login/oauth/access_token',
  )
})

Deno.test('github URLs honor DONITS_GITHUB_BASE_URL override', () => {
  Deno.env.set('DONITS_GITHUB_BASE_URL', 'http://localhost:9999')

  try {
    assertEquals(
      githubDeviceCodeUrl(),
      'http://localhost:9999/login/device/code',
    )
    assertEquals(
      githubAccessTokenUrl(),
      'http://localhost:9999/login/oauth/access_token',
    )
  } finally {
    Deno.env.delete('DONITS_GITHUB_BASE_URL')
  }
})
