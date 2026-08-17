import {
  applyTheme,
  argbFromHex,
  themeFromSourceColor,
} from '@material/material-color-utilities'

const PINK = '#dd7ab9'
const SEED_COLOR = '#93d8f3'

export function initTheme(): void {
  const theme = themeFromSourceColor(argbFromHex(SEED_COLOR))
  const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  function applySchemeFor(isDark: boolean): void {
    applyTheme(theme, { target: document.documentElement, dark: isDark })
  }

  applySchemeFor(darkMediaQuery.matches)
  darkMediaQuery.addEventListener('change', (event) => {
    applySchemeFor(event.matches)
  })
}

// Theme example

const DARK = {
  primary1: '#93d8f3',
  primary2: '#66bddb',
  primary3: '#6a9eb2',
  secondary1: '#eae192',
  secondary2: '#d1c34f',
  highlight1: '#ff7cd9',
  highlight2: '#412136',
  disabled: '#9a9096',
  bg1: '#121212',
  bg2: '#1d1d1d',
  fg: '#f5ebf0',
}

const LIGHT = {
  primary1: '#1c8cb3',
  primary2: '#00607b',
  primary3: '#126583',
  secondary1: '#605700',
  highlight1: '#9a0074',
  highlight2: '#fad0e8',
  secondary2: '#8d7f1c',
  disabled: '#aca1a7',
  bg1: '#e9e9e9',
  bg2: '#fdfbfc',
  fg: '#050304',
}
