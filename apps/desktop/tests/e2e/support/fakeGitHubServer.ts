export type FakeGitHubServer = {
  url: string
  close: () => Promise<void>
}

export async function startFakeGitHubServer(
  options: { accessToken?: string } = {},
): Promise<FakeGitHubServer> {
  const accessToken = options.accessToken ?? 'fake-github-access-token'

  const server = Deno.serve(
    { port: 0, onListen: () => {} },
    (request) => {
      const url = new URL(request.url)

      if (request.method === 'POST' && url.pathname === '/login/device/code') {
        return Response.json({
          device_code: 'fake-device-code',
          user_code: 'FAKE-CODE',
          verification_uri: `${url.origin}/login/device`,
          expires_in: 900,
          interval: 1,
        })
      }

      if (
        request.method === 'POST' &&
        url.pathname === '/login/oauth/access_token'
      ) {
        return Response.json({ access_token: accessToken })
      }

      return new Response('Not Found', { status: 404 })
    },
  )

  const { port } = server.addr as Deno.NetAddr

  return {
    url: `http://localhost:${port}`,
    close: () => server.shutdown(),
  }
}
