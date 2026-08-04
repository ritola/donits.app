import {
  clone,
  getGitHubAuthStatus,
  listBranchDocContents,
  listBranches,
  startGitHubDeviceAuth,
} from './src/features/git/backend.ts'
import { Hono } from 'hono'
import { Server as RpcServer } from 'rpc-websockets'
import { createServer } from 'node:http'
import { Buffer } from 'node:buffer'
import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { Readable } from 'node:stream'

const PORT = 6879

export function startServer() {
  const http = new Hono()

  const rpc = new RpcServer({ noServer: true })
  const ns = rpc.of('/rpc')

  ns.register('git.startGitHubDeviceAuth', () => startGitHubDeviceAuth())
  ns.register('git.getGitHubAuthStatus', () => getGitHubAuthStatus())

  ns.register('git.clone', async (params: unknown) => {
    try {
      const payload = Array.isArray(params) ? params[0] : params
      const { repositoryUrl } = (payload ?? {}) as {
        repositoryUrl?: string
      }

      if (!repositoryUrl) {
        throw new Error('GitHub repository URL is required')
      }

      const res = await clone(repositoryUrl)

      // Ensure we NEVER return undefined to rpc-websockets.
      // If clone() returns void/undefined, return a boolean or explicit object.
      return res ?? { success: true }
    } catch (err) {
      console.error('RPC Error:', err)
      throw err instanceof Error ? err.message : String(err)
    }
  })

  ns.register('git.listBranches', async () => {
    try {
      return await listBranches()
    } catch (err) {
      console.error('RPC Error:', err)
      throw err instanceof Error ? err.message : String(err)
    }
  })

  ns.register('git.listBranchDocContents', async () => {
    try {
      return await listBranchDocContents()
    } catch (err) {
      console.error('RPC Error:', err)
      throw err instanceof Error ? err.message : String(err)
    }
  })

  const server = createServer((req, res) => {
    void (async () => {
      const response = await http.fetch(toRequest(req))
      res.statusCode = response.status
      response.headers.forEach((value, key) => res.setHeader(key, value))
      res.end(Buffer.from(await response.arrayBuffer()))
    })().catch((err) => {
      console.error('[server] request error:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    })
  })

  server.on(
    'upgrade',
    (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      const url = toUrl(req)

      // Ignore non-/rpc paths
      if (url.pathname !== '/rpc') {
        socket.destroy()
        return
      }

      rpc.wss.handleUpgrade(req, socket, head, (ws) => {
        rpc.wss.emit('connection', ws, req)
      })
    },
  )

  // Emit heartbeat tick across all connections on /rpc
  const intervalId = setInterval(() => {
    ns.emit('tick', { timestamp: Date.now() } as unknown as string)
  }, 5000)

  server.on('close', () => {
    clearInterval(intervalId)
    rpc.close()
  })

  server.listen(PORT, () => {
    console.log(
      `[server] Hono API + rpc-websockets listening on http://localhost:${PORT}`,
    )
  })

  return server
}

function toRequest(req: IncomingMessage): Request {
  const init: RequestInit & { duplex?: 'half' } = {
    method: req.method,
    headers: toHeaders(req.headers),
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = Readable.toWeb(req) as ReadableStream<Uint8Array>
    init.duplex = 'half'
  }

  return new Request(toUrl(req), init)
}

function toUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
}

function toHeaders(headers: IncomingMessage['headers']): Headers {
  const result = new Headers()

  Object.entries(headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => result.append(key, entry))
      return
    }

    if (value !== undefined) {
      result.set(key, value)
    }
  })

  return result
}

if (import.meta.main) {
  startServer()
}
