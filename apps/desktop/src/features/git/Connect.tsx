/// <reference path="../../theme/material-web.d.ts" />
import { SyntheticEvent, useEffect, useRef, useState } from 'react'
import { isLeft } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import {
  chainFirstW,
  chainW,
  fromIO,
  left,
  map,
  right,
  type TaskEither,
  tryCatch,
} from 'fp-ts/TaskEither'

import '@material/web/textfield/outlined-text-field.js'
import '@material/web/button/filled-button.js'

import './Connect.css'
import type { ConnectionState, DeviceAuth } from '../../App.tsx'
import {
  clone,
  getGitHubAuthStatus,
  startGitHubDeviceAuth,
} from './frontend.ts'

const POLL_INTERVAL_MS = 2000

async function waitForGitHubAuth(expiresIn: number): Promise<void> {
  const deadline = Date.now() + expiresIn * 1000

  while (Date.now() < deadline) {
    const status = await getGitHubAuthStatus()

    if (status.accessToken) {
      return
    }

    if (!status.deviceAuth) {
      throw new Error('GitHub authorization was denied or expired.')
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }

  throw new Error('GitHub authorization timed out.')
}

type ConnectProps = {
  setConnection: (connection: ConnectionState) => void
}

export default function Connect({ setConnection }: ConnectProps) {
  const [githubRepositoryUrl, setGithubRepositoryUrl] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [deviceAuth, setDeviceAuth] = useState<DeviceAuth | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    const repositoryUrl = githubRepositoryUrl.trim()
    if (!repositoryUrl) {
      setError('GitHub repository URL is required.')
      return
    }

    setIsConnecting(true)
    setError(null)
    setIsConnected(false)
    setDeviceAuth(null)
    setConnection({ repositoryUrl: null, deviceAuth: null })

    type ConnectFailure = Error | 'unmounted'

    const toConnectFailure = (error: unknown): ConnectFailure =>
      error instanceof Error ? error : new Error('Failed to connect to Git.')

    const ensureMounted = (): TaskEither<ConnectFailure, void> =>
      isMountedRef.current ? right(undefined) : left('unmounted')

    const onlyWhileMounted = <A,>(
      task: TaskEither<ConnectFailure, A>,
    ): TaskEither<ConnectFailure, A> => pipe(task, chainFirstW(ensureMounted))

    const connectTask = <A,>(
      task: () => Promise<A>,
    ): TaskEither<ConnectFailure, A> =>
      onlyWhileMounted(tryCatch(task, toConnectFailure))

    const result = await pipe(
      connectTask(() => startGitHubDeviceAuth()),
      chainFirstW((auth) =>
        fromIO(() => {
          const deviceAuth = {
            userCode: auth.userCode,
            verificationUri: auth.verificationUri,
          }

          setDeviceAuth(deviceAuth)
          setConnection({ repositoryUrl: null, deviceAuth })
        })
      ),
      chainW((auth) =>
        pipe(
          connectTask(() => waitForGitHubAuth(auth.expiresIn)),
          map(() => auth),
        )
      ),
      chainW((auth) =>
        pipe(
          connectTask(() => clone(repositoryUrl)),
          map(() => auth),
        )
      ),
      chainFirstW((auth) =>
        fromIO(() => {
          setConnection({
            repositoryUrl,
            deviceAuth: {
              userCode: auth.userCode,
              verificationUri: auth.verificationUri,
            },
          })
          setIsConnected(true)
        })
      ),
    )()

    if (isMountedRef.current) {
      if (isLeft(result) && result.left !== 'unmounted') {
        setConnection({ repositoryUrl: null, deviceAuth: null })
        setError(result.left.message)
      }

      setIsConnecting(false)
      setDeviceAuth(null)
    }
  }

  return (
    <form
      className='connect-form'
      onSubmit={(event) => void handleSubmit(event)}
    >
      <md-outlined-text-field
        autocomplete='off'
        disabled={isConnecting}
        label='GitHub repository URL'
        name='githubRepositoryUrl'
        onInput={(event) => setGithubRepositoryUrl(event.currentTarget.value)}
        required
        type='text'
        value={githubRepositoryUrl}
      />
      <md-filled-button disabled={isConnecting} type='submit'>
        {isConnecting ? 'Connecting...' : 'Connect'}
      </md-filled-button>
      {deviceAuth && (
        <div className='connect-device-auth'>
          <p className='connect-status md-typescale-body-medium'>
            GitHub code <strong>{deviceAuth.userCode}</strong>
          </p>
          <md-filled-button
            onClick={() =>
              globalThis.open(deviceAuth.verificationUri, '_blank')}
            type='button'
          >
            Open GitHub
          </md-filled-button>
        </div>
      )}
      {isConnected && (
        <p className='connect-status md-typescale-body-medium'>
          Connected to Git.
        </p>
      )}
      {error && (
        <p className='connect-error md-typescale-body-medium' role='alert'>
          {error}
        </p>
      )}
    </form>
  )
}
