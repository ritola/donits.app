import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { join } from '@std/path'

import { getSettingsDirectory } from '../../lib/backend/settings.ts'

const GITHUB_CLIENT_ID = 'Iv23lif1vNWMuBk951bj'
const MAX_RECENT_REPOSITORIES = 10
const REPOSITORY_DIR = join(getSettingsDirectory(), 'repositories')
const DOC_FOLDERS = {
  backlog: 'doc/backlog',
  done: 'doc/done',
} as const

const state: {
  githubAccessToken: string | null
  githubDeviceAuth: { userCode: string; verificationUri: string } | null
  repositoryDir: string | null
} = {
  githubAccessToken: null,
  githubDeviceAuth: null,
  repositoryDir: null,
}

type DeviceCodeResponse = {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

type DeviceTokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
  interval?: number
}

export type BranchDocContents = {
  branch: string
  backlog: string[]
  done: string[]
}

export async function startGitHubDeviceAuth(): Promise<{
  userCode: string
  verificationUri: string
  expiresIn: number
}> {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: 'read:user',
    }),
  })

  const payload = await res.json() as DeviceCodeResponse & {
    error?: string
    error_description?: string
  }

  if (!res.ok || !payload.device_code) {
    throw new Error(
      payload.error_description ??
        payload.error ??
        'Failed to start GitHub device authorization',
    )
  }

  state.githubAccessToken = null
  state.githubDeviceAuth = {
    userCode: payload.user_code,
    verificationUri: payload.verification_uri,
  }

  void pollGitHubDeviceToken(payload.device_code, payload.interval)

  return {
    userCode: payload.user_code,
    verificationUri: payload.verification_uri,
    expiresIn: payload.expires_in,
  }
}

async function pollGitHubDeviceToken(
  deviceCode: string,
  intervalSeconds: number,
): Promise<void> {
  let interval = intervalSeconds

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, interval * 1000))

    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    })

    const payload = await res.json() as DeviceTokenResponse

    if (payload.access_token) {
      state.githubAccessToken = payload.access_token
      state.githubDeviceAuth = null
      return
    }

    if (payload.error === 'authorization_pending') {
      continue
    }

    if (payload.error === 'slow_down') {
      interval = payload.interval ?? interval + 5
      continue
    }

    // Any other error (access_denied, expired_token, ...) ends the poll.
    state.githubDeviceAuth = null
    return
  }
}

export function getGitHubAuthStatus(): {
  accessToken: boolean
  deviceAuth: { userCode: string; verificationUri: string } | null
} {
  return {
    accessToken: state.githubAccessToken !== null,
    deviceAuth: state.githubDeviceAuth,
  }
}

export function clone(repositoryUrl: string): Promise<void> {
  const githubAccessToken = state.githubAccessToken
  const repositoryDir = join(
    REPOSITORY_DIR,
    createHash('sha256').update(repositoryUrl).digest('hex'),
  )

  if (!githubAccessToken) {
    throw new Error('GitHub access token is required')
  }

  return git.clone({
    fs,
    http,
    dir: repositoryDir,
    url: repositoryUrl,
    onAuth: () => ({
      username: githubAccessToken,
    }),
  }).then(() => {
    state.repositoryDir = repositoryDir
  })
}

export function listRepositoryUrls(): string[] {
  const repositoryUrls: string[] = []
  const seenRepositoryUrls = new Set<string>()

  for (const repositoryDir of listGitRepositoryDirs()) {
    for (const repositoryUrl of listRemoteUrls(repositoryDir)) {
      if (seenRepositoryUrls.has(repositoryUrl)) {
        continue
      }

      seenRepositoryUrls.add(repositoryUrl)
      repositoryUrls.push(repositoryUrl)

      if (repositoryUrls.length === MAX_RECENT_REPOSITORIES) {
        return repositoryUrls
      }
    }
  }

  return repositoryUrls
}

function listGitRepositoryDirs(): string[] {
  try {
    return fs.readdirSync(REPOSITORY_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(REPOSITORY_DIR, entry.name))
  } catch {
    return []
  }
}

function listRemoteUrls(repositoryDir: string): string[] {
  try {
    return parseRemoteUrls(
      fs.readFileSync(join(repositoryDir, '.git', 'config'), 'utf8'),
    )
  } catch {
    return []
  }
}

function parseRemoteUrls(config: string): string[] {
  const remoteUrls: string[] = []
  let isRemoteSection = false

  for (const rawLine of config.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#') || line.startsWith(';')) {
      continue
    }

    if (line.startsWith('[') && line.endsWith(']')) {
      isRemoteSection = line.startsWith('[remote ')
      continue
    }

    if (!isRemoteSection) {
      continue
    }

    const match = /^url\s*=\s*(.+)$/.exec(line)
    const remoteUrl = match?.[1]?.trim()

    if (remoteUrl) {
      remoteUrls.push(remoteUrl)
    }
  }

  return remoteUrls
}

export async function listBranches(): Promise<string[]> {
  if (!state.repositoryDir) return Promise.resolve([])

  const remoteBranches = await git.listBranches({
    fs,
    dir: state.repositoryDir,
    remote: 'origin',
  })
  const branches = remoteBranches.filter((branch) => branch !== 'HEAD')

  if (branches.length > 0) {
    return branches
  }

  return await git.listBranches({
    fs,
    dir: state.repositoryDir,
  })
}

export async function listBranchDocContents(): Promise<BranchDocContents[]> {
  const branches = await listBranches()

  return await Promise.all(branches.map(async (branch) => {
    const files = await listFilesForBranch(branch)

    return {
      branch,
      backlog: listFolderContents(files, DOC_FOLDERS.backlog),
      done: listFolderContents(files, DOC_FOLDERS.done),
    }
  }))
}

async function listFilesForBranch(branch: string): Promise<string[]> {
  if (!state.repositoryDir) return Promise.resolve([])

  const refs = [branch, `origin/${branch}`, `refs/remotes/origin/${branch}`]

  for (const ref of refs) {
    try {
      return await git.listFiles({
        fs,
        dir: state.repositoryDir,
        ref,
      })
    } catch (err) {
      if (ref === refs[refs.length - 1]) {
        throw err
      }
    }
  }

  return []
}

function listFolderContents(files: string[], folder: string): string[] {
  const prefix = `${folder}/`

  return files
    .filter((file) => file.startsWith(prefix))
    .map((file) => file.slice(prefix.length))
}
