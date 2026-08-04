import { useState } from 'react'

import Branches from './features/git/Branches.tsx'
import Connect from './features/git/Connect.tsx'

export type DeviceAuth = {
  userCode: string
  verificationUri: string
}

export type ConnectionState = {
  repositoryUrl: string | null
  deviceAuth: DeviceAuth | null
}

export default function App() {
  const [connection, setConnection] = useState<ConnectionState>({
    repositoryUrl: null,
    deviceAuth: null,
  })
  const isConnected = connection.repositoryUrl && connection.deviceAuth

  return (
    <>
      <h1 className='md-typescale-headline-large'>Hello, Donits.app</h1>
      {isConnected
        ? (
          <div>
            <p className='md-typescale-body-medium'>
              Connected to {connection.repositoryUrl}
            </p>
            <Branches />
          </div>
        )
        : <Connect setConnection={setConnection} />}
    </>
  )
}
