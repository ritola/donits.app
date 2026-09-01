import type { Page } from 'playwright'
import { chromium } from 'playwright'
import { fromFileUrl } from '@std/path'

const FRONTEND_URL = 'http://localhost:5173'
const FRONTEND_PORT = 5173
const BACKEND_PORT = 6879
const READY_TIMEOUT_MS = 20_000
const READY_POLL_INTERVAL_MS = 200

export type TestApp = {
  frontendUrl: string
  newPage: () => Promise<Page>
  close: () => Promise<void>
}

export async function startTestApp(
  options: { githubBaseUrl: string },
): Promise<TestApp> {
  await ensurePortsAreFree()

  const configDir = await Deno.makeTempDir({ prefix: 'donits-e2e-config-' })
  const desktopDir = fromFileUrl(new URL('../../../', import.meta.url))

  const viteProcess = new Deno.Command('deno', {
    args: ['run', '-A', 'npm:vite'],
    cwd: desktopDir,
    env: {
      DONITS_GITHUB_BASE_URL: options.githubBaseUrl,
      DONITS_CONFIG_DIR: configDir,
      DONITS_SECRET_STORE: 'memory',
    },
    stdout: 'piped',
    stderr: 'piped',
  }).spawn()

  let capturedStderr = ''
  const stderrDrain = drain(viteProcess.stderr, (chunk) => {
    capturedStderr += chunk
  })
  const stdoutDrain = drain(viteProcess.stdout, () => {})

  try {
    await waitUntilReady(() => capturedStderr)
  } catch (error) {
    await killProcess(viteProcess)
    await Deno.remove(configDir, { recursive: true })
    throw error
  }

  const browser = await chromium.launch()

  return {
    frontendUrl: FRONTEND_URL,
    newPage: () => browser.newPage(),
    close: async () => {
      await browser.close()
      await killProcess(viteProcess)
      await Promise.all([stderrDrain, stdoutDrain])
      await Deno.remove(configDir, { recursive: true })
    },
  }
}

async function killProcess(process: Deno.ChildProcess): Promise<void> {
  try {
    process.kill()
  } catch {
    // already exited
  }
  await process.status
}

function drain(
  stream: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
): Promise<void> {
  const decoder = new TextDecoder()

  return (async () => {
    for await (const chunk of stream) {
      onChunk(decoder.decode(chunk, { stream: true }))
    }
  })()
}

async function ensurePortsAreFree(): Promise<void> {
  if (await isPortOpen(FRONTEND_PORT) || await isPortOpen(BACKEND_PORT)) {
    throw new Error(
      'Ports 5173/6879 are already in use — stop any running ' +
        '`deno task -f desktop dev` before running the e2e tests.',
    )
  }
}

async function isPortOpen(port: number): Promise<boolean> {
  try {
    const conn = await Deno.connect({ hostname: 'localhost', port })
    conn.close()
    return true
  } catch {
    return false
  }
}

async function waitUntilReady(getStderr: () => string): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS

  while (Date.now() < deadline) {
    if (await isPortOpen(FRONTEND_PORT) && await isPortOpen(BACKEND_PORT)) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, READY_POLL_INTERVAL_MS))
  }

  throw new Error(
    `Timed out waiting for the dev server and backend to start.\n${getStderr()}`,
  )
}
