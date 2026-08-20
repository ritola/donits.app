import { Entry } from '@napi-rs/keyring'

const SERVICE_NAME = 'donits.app'

export function getSecret(account: string): string | undefined {
  try {
    return new Entry(SERVICE_NAME, account).getPassword() || undefined
  } catch {
    return undefined
  }
}

export function setSecret(account: string, value: string): void {
  new Entry(SERVICE_NAME, account).setPassword(value)
}

export function clearSecret(account: string): void {
  try {
    new Entry(SERVICE_NAME, account).deletePassword()
  } catch {
    // Nothing stored for this account.
  }
}
