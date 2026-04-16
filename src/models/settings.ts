export interface UserSettings {
  quadrantThreshold: {
    importance: number
    urgency: number
  }
  timezone: string
  theme: 'light' | 'dark' | 'system'
  emailReport: {
    enabled: boolean
    senderEmail: string
    senderAuthCode: string
    recipientEmail: string
    intervalDays: number
    startDate: string
    sendTime: string
  }
  betaFlags: Record<string, boolean>
}

export const DEFAULT_SETTINGS: UserSettings = {
  quadrantThreshold: { importance: 6, urgency: 6 },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  theme: 'system',
  emailReport: {
    enabled: false,
    senderEmail: '',
    senderAuthCode: '',
    recipientEmail: '',
    intervalDays: 1,
    startDate: new Date().toISOString().slice(0, 10),
    sendTime: '09:00',
  },
  betaFlags: {},
}
