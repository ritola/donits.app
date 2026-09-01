import { assertEquals } from '@std/assert'
import { getSettingsDirectory } from './settings.ts'

Deno.test('getSettingsDirectory honors DONITS_CONFIG_DIR override', () => {
  const expected = Deno.env.get('DONITS_CONFIG_DIR')

  if (!expected) {
    throw new Error(
      'DONITS_CONFIG_DIR must be set when running this test (see the ' +
        'test:unit deno task) so it never touches the real app-support directory.',
    )
  }

  assertEquals(getSettingsDirectory(), expected)
})
