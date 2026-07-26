import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@material/web/typography/md-typescale-styles.css'
import './theme/global.css'
import { initTheme } from './theme/theme.ts'
import App from './App.tsx'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
