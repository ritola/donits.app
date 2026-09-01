import { join } from '@std/path'

export type GitFixtureServer = {
  url: string
  close: () => Promise<void>
}

export async function startGitFixtureServer(): Promise<GitFixtureServer> {
  const reposRoot = await Deno.makeTempDir({ prefix: 'donits-e2e-repos-' })
  const repoName = 'fixture.git'

  await createFixtureRepository(join(reposRoot, repoName))

  const server = Deno.serve(
    { port: 0, onListen: () => {} },
    (request) => handleGitHttpBackend(request, reposRoot),
  )

  const { port } = server.addr as Deno.NetAddr

  return {
    url: `http://localhost:${port}/${repoName}`,
    close: async () => {
      await server.shutdown()
      await Deno.remove(reposRoot, { recursive: true })
    },
  }
}

async function createFixtureRepository(bareRepoPath: string): Promise<void> {
  await run(['git', 'init', '--bare', '--initial-branch=main', bareRepoPath])

  const workDir = await Deno.makeTempDir({
    prefix: 'donits-e2e-fixture-work-',
  })

  try {
    await run(['git', 'init', '--initial-branch=main'], workDir)
    await run(['git', 'config', 'user.email', 'e2e@donits.app'], workDir)
    await run(['git', 'config', 'user.name', 'Donits E2E'], workDir)
    await Deno.mkdir(join(workDir, 'doc', 'backlog'), { recursive: true })
    await Deno.writeTextFile(
      join(workDir, 'doc', 'backlog', 'example.md'),
      '# Example backlog item\n',
    )
    await run(['git', 'add', '.'], workDir)
    await run(['git', 'commit', '-m', 'Add example backlog item'], workDir)
    await run(['git', 'remote', 'add', 'origin', bareRepoPath], workDir)
    await run(['git', 'push', 'origin', 'main'], workDir)
  } finally {
    await Deno.remove(workDir, { recursive: true })
  }
}

async function run(cmd: string[], cwd?: string): Promise<void> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  })
  const result = await command.output()

  if (!result.success) {
    throw new Error(
      `Command failed (${cmd.join(' ')}): ${
        new TextDecoder().decode(result.stderr)
      }`,
    )
  }
}

async function handleGitHttpBackend(
  request: Request,
  reposRoot: string,
): Promise<Response> {
  const url = new URL(request.url)
  const body = request.method === 'GET' || request.method === 'HEAD'
    ? new Uint8Array()
    : new Uint8Array(await request.arrayBuffer())

  const command = new Deno.Command('git', {
    args: ['http-backend'],
    cwd: reposRoot,
    env: {
      GIT_PROJECT_ROOT: reposRoot,
      GIT_HTTP_EXPORT_ALL: '1',
      PATH_INFO: url.pathname,
      QUERY_STRING: url.search.replace(/^\?/, ''),
      REQUEST_METHOD: request.method,
      CONTENT_TYPE: request.headers.get('content-type') ?? '',
      CONTENT_LENGTH: String(body.byteLength),
      REMOTE_USER: '',
      REMOTE_ADDR: '127.0.0.1',
      GATEWAY_INTERFACE: 'CGI/1.1',
      SERVER_PROTOCOL: 'HTTP/1.1',
    },
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  })

  const child = command.spawn()

  const writer = child.stdin.getWriter()
  await writer.write(body)
  await writer.close()

  const [stdout, status, stderr] = await Promise.all([
    new Response(child.stdout).arrayBuffer(),
    child.status,
    new Response(child.stderr).arrayBuffer(),
  ])

  if (!status.success) {
    throw new Error(
      `git http-backend failed: ${new TextDecoder().decode(stderr)}`,
    )
  }

  return parseCgiResponse(new Uint8Array(stdout))
}

function parseCgiResponse(raw: Uint8Array): Response {
  const headerEnd = findHeaderEnd(raw)
  const headerText = new TextDecoder().decode(raw.subarray(0, headerEnd))
  const body = raw.subarray(Math.min(headerEnd + 4, raw.length))

  const headers = new Headers()
  let status = 200

  for (const line of headerText.split('\r\n')) {
    if (!line) continue

    const separatorIndex = line.indexOf(':')
    const name = line.slice(0, separatorIndex)
    const value = line.slice(separatorIndex + 1).trim()

    if (name.toLowerCase() === 'status') {
      status = Number.parseInt(value.split(' ')[0], 10)
    } else {
      headers.append(name, value)
    }
  }

  return new Response(body as BodyInit, { status, headers })
}

function findHeaderEnd(raw: Uint8Array): number {
  for (let i = 0; i < raw.length - 3; i++) {
    if (
      raw[i] === 13 && raw[i + 1] === 10 && raw[i + 2] === 13 &&
      raw[i + 3] === 10
    ) {
      return i
    }
  }

  return raw.length
}
