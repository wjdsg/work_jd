export type ReminderChannel = 'in-app'
export type ReminderState = 'scheduled' | 'snoozed' | 'fired' | 'dismissed'

export interface ReminderConfigRef {
  id: string
  taskId: string
  minutesBefore: number
  fireAt: string
  channel: ReminderChannel
  enabled: boolean
}

export interface ReminderSnapshot extends ReminderConfigRef {
  state: ReminderState
  snoozeCount: number
}
