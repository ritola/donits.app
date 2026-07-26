import {
  applyTheme,
  argbFromHex,
  themeFromSourceColor,
} from '@material/material-color-utilities'

const SEED_COLOR = '#dd7ab9'

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
