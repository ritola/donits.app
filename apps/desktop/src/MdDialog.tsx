import { type ReactNode, useEffect, useRef } from 'react'

import '@material/web/dialog/dialog.js'

type MdDialogProps = {
  children: ReactNode
  className?: string
  open?: boolean
}

export default function MdDialog({ children, className, open }: MdDialogProps) {
  const dialogRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    const preventCancel = (event: Event) => {
      event.preventDefault()
    }
    const preventEscapeCancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
      }
    }

    dialog.addEventListener('cancel', preventCancel)
    dialog.addEventListener('keydown', preventEscapeCancel, {
      capture: true,
    })

    return () => {
      dialog.removeEventListener('cancel', preventCancel)
      dialog.removeEventListener('keydown', preventEscapeCancel, {
        capture: true,
      })
    }
  }, [open])

  return (
    <md-dialog className={className} open={open} ref={dialogRef}>
      {children}
    </md-dialog>
  )
}
