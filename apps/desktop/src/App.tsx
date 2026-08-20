import { useEffect, useState } from 'react'

import Branches from './features/git/Branches.tsx'
import Connect from './features/git/Connect.tsx'
import { getConnectionState } from './features/git/frontend.ts'
import MdDialog from './MdDialog.tsx'

const donitsLogoUrl =
  new URL('../../../doc/assets/donits-symbol.svg', import.meta.url).href

export type DeviceAuth = {
  userCode: string
  verificationUri: string
}

export type ConnectionState = {
  repositoryUrl?: string
  deviceAuth?: DeviceAuth
}

export default function App() {
  const [connection, setConnection] = useState<ConnectionState>({
    repositoryUrl: undefined,
    deviceAuth: undefined,
  })
  const isConnected = connection.repositoryUrl !== undefined

  useEffect(() => {
    let isCurrent = true

    void getConnectionState()
      .then(({ repositoryUrl }) => {
        if (isCurrent && repositoryUrl) {
          setConnection({ repositoryUrl, deviceAuth: undefined })
        }
      })
      .catch(() => {})

    return () => {
      isCurrent = false
    }
  }, [])

  return (
    <>
      <nav
        style={{
          alignItems: 'center',
          backgroundColor: '#412136',
          color: '#fff',
          display: 'flex',
          minHeight: '64px',
          padding: '0 24px',
          width: '100%',
        }}
      >
        <img
          alt=''
          src={donitsLogoUrl}
          style={{
            height: '40px',
            marginRight: '12px',
            width: '40px',
          }}
        />
        <span className='md-typescale-title-large'>donits.app</span>
      </nav>
      {isConnected
        ? (
          <div>
            <p className='md-typescale-body-medium'>
              Connected to {connection.repositoryUrl}
            </p>
            <Branches />
          </div>
        )
        : (
          <MdDialog
            className='connect-dialog'
            open
          >
            <div slot='headline'>Connect to Git</div>
            <div slot='content'>
              <Connect setConnection={setConnection} />
            </div>
          </MdDialog>
        )}
    </>
  )
}
