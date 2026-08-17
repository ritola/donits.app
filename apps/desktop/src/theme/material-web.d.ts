import type * as React from 'react'

interface MdOutlinedTextFieldElement extends HTMLElement {
  value: string
}

interface MdOutlinedTextFieldAttributes
  extends React.HTMLAttributes<MdOutlinedTextFieldElement> {
  autocomplete?: string
  disabled?: boolean
  label?: string
  name?: string
  required?: boolean
  type?: string
  value?: string
}

interface MdFilledButtonAttributes extends React.HTMLAttributes<HTMLElement> {
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

interface MdDialogAttributes extends React.HTMLAttributes<HTMLElement> {
  open?: boolean
  onCancel?: (event: React.SyntheticEvent<HTMLFormElement>) => void
  ref?: React.Ref<HTMLElement>
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'md-outlined-text-field': MdOutlinedTextFieldAttributes
      'md-filled-button': MdFilledButtonAttributes
      'md-dialog': MdDialogAttributes
    }
  }
}
