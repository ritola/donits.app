import { useEffect, useState } from 'react'

import { type BranchDocContents, listBranchDocContents } from './frontend.ts'

export default function Branches() {
  const [branches, setBranches] = useState<BranchDocContents[] | null>(null)
  const [branchesError, setBranchesError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    setBranches(null)
    setBranchesError(null)

    void listBranchDocContents()
      .then((branches) => {
        if (isCurrent) {
          setBranches(branches)
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setBranchesError(
            error instanceof Error ? error.message : 'Failed to list branches.',
          )
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  if (branchesError) {
    return (
      <p className='md-typescale-body-medium' role='alert'>
        {branchesError}
      </p>
    )
  }

  if (branches) {
    return (
      <ul className='md-typescale-body-medium'>
        {branches.map(({ branch, backlog, done }) => (
          <li key={branch}>
            <strong>{branch}</strong>
            <FolderContents title='Backlog' contents={backlog} />
            <FolderContents title='Done' contents={done} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <p className='md-typescale-body-medium'>
      Loading branches...
    </p>
  )
}

function FolderContents(
  { title, contents }: { title: string; contents: string[] },
) {
  return (
    <>
      <p>{title}</p>
      {contents.length > 0
        ? (
          <ul>
            {contents.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )
        : <p>Empty</p>}
    </>
  )
}
