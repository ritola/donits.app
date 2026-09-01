export function scenario(
  name: string,
  fn: (t: Deno.TestContext) => void | Promise<void>,
): void {
  Deno.test({
    name,
    fn,
    // Spawns real processes/servers/browsers; Deno's leak sanitizer can't
    // always see those resources close synchronously.
    sanitizeResources: false,
    sanitizeOps: false,
  })
}

type StepBody = () => void | Promise<void>

function makeStep(label: string) {
  return (t: Deno.TestContext, description: string, body: StepBody) =>
    t.step(`${label} ${description}`, body)
}

export const given = makeStep('Given')
export const when = makeStep('When')
export const then = makeStep('Then')
export const and = makeStep('And')
