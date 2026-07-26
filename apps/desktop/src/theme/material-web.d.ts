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

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-outlined-text-field': MdOutlinedTextFieldAttributes
      'md-filled-button': MdFilledButtonAttributes
    }
  }
}
