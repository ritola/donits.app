import { assertEquals } from '@std/assert'
import { join } from '@std/path'
import { startGitFixtureServer } from './gitFixtureServer.ts'

Deno.test({
  name: 'git fixture server serves a clonable repository on main',
  fn: async () => {
    const fixture = await startGitFixtureServer()
    const cloneDir = await Deno.makeTempDir({
      prefix: 'donits-e2e-clone-test-',
    })

    try {
      const clone = new Deno.Command('git', {
        args: ['clone', fixture.url, cloneDir],
        stdout: 'piped',
        stderr: 'piped',
      })
      const cloneResult = await clone.output()

      if (!cloneResult.success) {
        throw new Error(
          `git clone failed: ${new TextDecoder().decode(cloneResult.stderr)}`,
        )
      }

      const branch = new Deno.Command('git', {
        args: ['branch', '--show-current'],
        cwd: cloneDir,
        stdout: 'piped',
      })
      const branchResult = await branch.output()
      const branchName = new TextDecoder().decode(branchResult.stdout).trim()

      assertEquals(branchName, 'main')

      const fixtureFile = await Deno.readTextFile(
        join(cloneDir, 'doc', 'backlog', 'example.md'),
      )
      assertEquals(fixtureFile, '# Example backlog item\n')
    } finally {
      await Deno.remove(cloneDir, { recursive: true })
      await fixture.close()
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
})
