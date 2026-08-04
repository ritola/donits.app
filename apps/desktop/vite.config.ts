import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import deno from '@deno/vite-plugin'
import { startServer } from './server.ts'

function apiServerPlugin(): Plugin {
  return {
    name: 'start-api-server',
    apply: 'serve',
    configureServer(viteServer) {
      const server = startServer()
      viteServer.httpServer?.once('close', () => server.close())
    },
  }
}

export default defineConfig({
  plugins: [react(), deno(), apiServerPlugin()],
  optimizeDeps: {
    include: ['react/jsx-runtime'],
  },
})
