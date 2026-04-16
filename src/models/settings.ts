export interface UserSettings {
  quadrantThreshold: {
    importance: number
    urgency: number
  }
  timezone: string
  theme: 'light' | 'dark' | 'system'
  betaFlags: Record<string, boolean>
}

export const DEFAULT_SETTINGS: UserSettings = {
  quadrantThreshold: { importance: 6, urgency: 6 },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  theme: 'system',
  betaFlags: {},
}
