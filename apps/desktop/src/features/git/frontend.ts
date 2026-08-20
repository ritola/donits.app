import { Client } from 'rpc-websockets'

export type GitHubDeviceAuth = {
  userCode: string
  verificationUri: string
  expiresIn: number
}

export type GitHubAuthStatus = {
  accessToken: boolean
  deviceAuth: { userCode: string; verificationUri: string } | undefined
}

export type BranchDocContents = {
  branch: string
  backlog: string[]
  done: string[]
}

function connect(): Promise<Client> {
  const protocol = globalThis.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//localhost:6879/rpc`

  const client = new Client(wsUrl)

  return new Promise((resolve, reject) => {
    client.once('open', () => resolve(client))
    client.once('error', reject)
  })
}

export async function startGitHubDeviceAuth(): Promise<GitHubDeviceAuth> {
  const client = await connect()

  try {
    return await client.call('git.startGitHubDeviceAuth') as GitHubDeviceAuth
  } finally {
    client.close()
  }
}

export async function getGitHubAuthStatus(): Promise<GitHubAuthStatus> {
  const client = await connect()

  try {
    return await client.call('git.getGitHubAuthStatus') as GitHubAuthStatus
  } finally {
    client.close()
  }
}

export async function clone(repositoryUrl: string): Promise<void> {
  const client = await connect()

  try {
    await client.call('git.clone', { repositoryUrl })
  } finally {
    client.close()
  }
}

export async function listRepositoryUrls(): Promise<string[]> {
  const client = await connect()

  try {
    return await client.call('git.listRepositoryUrls') as string[]
  } finally {
    client.close()
  }
}

export async function getConnectionState(): Promise<
  { repositoryUrl: string | null }
> {
  const client = await connect()

  try {
    return await client.call('git.getConnectionState') as {
      repositoryUrl: string | null
    }
  } finally {
    client.close()
  }
}

export async function listBranches(): Promise<string[]> {
  const client = await connect()

  try {
    return await client.call('git.listBranches') as string[]
  } finally {
    client.close()
  }
}

export async function listBranchDocContents(): Promise<BranchDocContents[]> {
  const client = await connect()

  try {
    return await client.call('git.listBranchDocContents') as BranchDocContents[]
  } finally {
    client.close()
  }
}
