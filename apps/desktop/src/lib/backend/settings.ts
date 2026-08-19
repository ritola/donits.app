import { join } from '@std/path'

const appName = 'donits.app'

type Settings = {
  foo: string
}

function getConfigDir(appName: string): string {
  const home = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || ''

  switch (Deno.build.os) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', appName)
    case 'windows':
      return Deno.env.get('APPDATA')
        ? join(Deno.env.get('APPDATA')!, appName)
        : join(home, 'AppData', 'Roaming', appName)
    case 'linux':
    default: {
      const xdg = Deno.env.get('XDG_CONFIG_HOME')
      return xdg ? join(xdg, appName) : join(home, '.config', appName)
    }
  }
}

export type SettingsStore<T extends object> = {
  get<K extends keyof T>(key: K): T[K]
  set<K extends keyof T>(key: K, value: T[K]): void
}

export function getSettingsDirectory(): string {
  const dir = getConfigDir(appName)
  Deno.mkdirSync(dir, { recursive: true })
  return dir
}

function getSettingsPath(): string {
  const dir = getSettingsDirectory()
  return join(dir, 'settings.json')
}

function saveSettings<T extends object>(configPath: string, settings: T) {
  Deno.writeTextFileSync(configPath, JSON.stringify(settings, null, 2))
}

function loadSettings<T extends object>(configPath: string, defaults: T): T {
  try {
    return { ...defaults, ...JSON.parse(Deno.readTextFileSync(configPath)) }
  } catch {
    const settings = { ...defaults }
    saveSettings(configPath, settings)
    return settings
  }
}

export function createSettingsManager(
  defaults: Settings,
): SettingsStore<Settings> {
  const configPath = getSettingsPath()
  const settings = loadSettings(configPath, defaults)

  return {
    get: (key) => settings[key],
    set: (key, value) => {
      settings[key] = value
      saveSettings(configPath, settings)
    },
  }
}
