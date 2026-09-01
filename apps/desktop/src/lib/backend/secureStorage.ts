import { Entry } from '@napi-rs/keyring'

const SERVICE_NAME = 'donits.app'

const memoryStore = new Map<string, string>()

function useMemoryStore(): boolean {
  return Deno.env.get('DONITS_SECRET_STORE') === 'memory'
}

export function getSecret(account: string): string | undefined {
  if (useMemoryStore()) {
    return memoryStore.get(account)
  }

  try {
    return new Entry(SERVICE_NAME, account).getPassword() || undefined
  } catch {
    return undefined
  }
}

export function setSecret(account: string, value: string): void {
  if (useMemoryStore()) {
    memoryStore.set(account, value)
    return
  }

  new Entry(SERVICE_NAME, account).setPassword(value)
}

export function clearSecret(account: string): void {
  if (useMemoryStore()) {
    memoryStore.delete(account)
    return
  }

  try {
    new Entry(SERVICE_NAME, account).deletePassword()
  } catch {
    // Nothing stored for this account.
  }
}
