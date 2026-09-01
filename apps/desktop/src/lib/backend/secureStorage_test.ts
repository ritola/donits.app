import { assertEquals } from '@std/assert'
import { clearSecret, getSecret, setSecret } from './secureStorage.ts'

Deno.test('secureStorage uses an in-memory store when DONITS_SECRET_STORE=memory', () => {
  Deno.env.set('DONITS_SECRET_STORE', 'memory')

  try {
    assertEquals(getSecret('e2e-test-account'), undefined)

    setSecret('e2e-test-account', 'e2e-test-value')
    assertEquals(getSecret('e2e-test-account'), 'e2e-test-value')

    clearSecret('e2e-test-account')
    assertEquals(getSecret('e2e-test-account'), undefined)
  } finally {
    Deno.env.delete('DONITS_SECRET_STORE')
  }
})
