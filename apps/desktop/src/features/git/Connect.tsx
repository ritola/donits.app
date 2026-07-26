/// <reference path="../../theme/material-web.d.ts" />
import { SyntheticEvent, useState } from 'react'

import '@material/web/textfield/outlined-text-field.js'
import '@material/web/button/filled-button.js'

import { clone } from '../../lib/git.ts'
import './Connect.css'

export default function Connect() {
  const [oauthUsername, setOauthUsername] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()

    const username = oauthUsername.trim()
    if (!username) {
      setError('OAuth username is required.')
      return
    }

    setIsConnecting(true)
    setError(null)
    setIsConnected(false)

    try {
      await clone(username)
      setIsConnected(true)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to connect to Git.',
      )
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <form className='connect-form' onSubmit={handleSubmit}>
      <md-outlined-text-field
        autocomplete='username'
        disabled={isConnecting}
        label='OAuth username'
        name='oauthUsername'
        onInput={(event) => setOauthUsername(event.currentTarget.value)}
        required
        type='text'
        value={oauthUsername}
      />
      <md-filled-button disabled={isConnecting} type='submit'>
        {isConnecting ? 'Connecting...' : 'Connect'}
      </md-filled-button>
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
