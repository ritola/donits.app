/// <reference path="../../theme/material-web.d.ts" />
import { SyntheticEvent, useEffect, useRef, useState } from 'react'
import { isLeft } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import {
  chainFirstW,
  chainW,
  fromIO,
  left,
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
  listRepositoryUrls,
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
  const [recentRepositoryUrls, setRecentRepositoryUrls] = useState<string[]>([])
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

  useEffect(() => {
    let isCurrent = true

    void listRepositoryUrls()
      .then((repositoryUrls) => {
        if (isCurrent && isMountedRef.current) {
          setRecentRepositoryUrls(repositoryUrls)
        }
      })
      .catch(() => {
        if (isCurrent && isMountedRef.current) {
          setRecentRepositoryUrls([])
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  async function connectRepository(repositoryUrlValue: string) {
    const repositoryUrl = repositoryUrlValue.trim()
    if (!repositoryUrl) {
      setError('GitHub repository URL is required.')
      return
    }

    setIsConnecting(true)
    setError(null)
    setIsConnected(false)
    setDeviceAuth(null)
    setConnection({ repositoryUrl: undefined, deviceAuth: undefined })

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

    const ensureGitHubAuth = (): TaskEither<ConnectFailure, void> =>
      pipe(
        connectTask(() => getGitHubAuthStatus()),
        chainW((status) =>
          status.accessToken ? right(undefined) : pipe(
            connectTask(() => startGitHubDeviceAuth()),
            chainFirstW((auth) =>
              fromIO(() => {
                const deviceAuth = {
                  userCode: auth.userCode,
                  verificationUri: auth.verificationUri,
                }

                setDeviceAuth(deviceAuth)
                setConnection({ repositoryUrl: undefined, deviceAuth })
              })
            ),
            chainW((auth) =>
              connectTask(() => waitForGitHubAuth(auth.expiresIn))
            ),
          )
        ),
      )

    const result = await pipe(
      ensureGitHubAuth(),
      chainW(() => connectTask(() => clone(repositoryUrl))),
      chainFirstW(() =>
        fromIO(() => {
          setConnection({ repositoryUrl, deviceAuth: undefined })
          setRecentRepositoryUrls((repositoryUrls) =>
            [
              repositoryUrl,
              ...repositoryUrls.filter((url) => url !== repositoryUrl),
            ].slice(0, 10)
          )
          setIsConnected(true)
        })
      ),
    )()

    if (isMountedRef.current) {
      if (isLeft(result) && result.left !== 'unmounted') {
        setConnection({ repositoryUrl: undefined, deviceAuth: undefined })
        setError(result.left.message)
      }

      setIsConnecting(false)
      setDeviceAuth(null)
    }
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    await connectRepository(githubRepositoryUrl)
  }

  return (
    <form
      className='connect-form'
      onSubmit={(event) => void handleSubmit(event)}
    >
      {recentRepositoryUrls.length > 0 && (
        <div className='connect-repository-url-picker'>
          <span className='connect-repository-url-heading md-typescale-label-large'>
            Recent repositories
          </span>
          <ul className='connect-repository-url-list'>
            {recentRepositoryUrls.map((repositoryUrl) => (
              <li className='connect-repository-url-item' key={repositoryUrl}>
                <a
                  aria-disabled={isConnecting}
                  className='connect-repository-url-link md-typescale-body-medium'
                  href={repositoryUrl}
                  onClick={(event) => {
                    event.preventDefault()

                    if (!isConnecting) {
                      setGithubRepositoryUrl(repositoryUrl)
                      void connectRepository(repositoryUrl)
                    }
                  }}
                >
                  <span
                    className='connect-repository-url-icon'
                    aria-hidden='true'
                  >
                    Git
                  </span>
                  <span className='connect-repository-url-text'>
                    {repositoryUrl}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <span className='connect-repository-url-heading md-typescale-label-large'>
        Add repository
      </span>
      <md-outlined-text-field
        autocomplete='off'
        className='connect-repository-url-field'
        disabled={isConnecting}
        label='GitHub Clone HTTPS URL'
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
