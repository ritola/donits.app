import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import deno from '@deno/vite-plugin'

function apiServerPlugin(): Plugin {
  return {
    name: 'start-api-server',
    apply: 'serve',
    configureServer(viteServer) {
      // Run as a separate process (`deno task server`) rather than importing
      // server.ts in-process: a static import here would make server.ts (and
      // everything it pulls in) a Vite config dependency, so editing it would
      // trigger a full Vite restart that re-binds port 6879 while the previous
      // instance still holds it.
      const child = new Deno.Command('deno', {
        args: ['task', 'server'],
        stdout: 'inherit',
        stderr: 'inherit',
      }).spawn()

      viteServer.httpServer?.once('close', () => {
        try {
          child.kill()
        } catch {
          // already exited
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), deno(), apiServerPlugin()],
  optimizeDeps: {
    include: ['react/jsx-runtime'],
  },
})
