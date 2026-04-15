import { useReminderStore } from '../store/reminderStore'
import { notificationBridge } from '../infrastructure/notificationBridge'
import { visibilityWatcher } from '../infrastructure/visibilityWatcher'
import type { ReminderConfigRef, ReminderSnapshot } from '../models/reminder'

type ReminderListener = (reminders: ReminderSnapshot[]) => void
type ReminderErrorListener = (error: Error) => void

const listeners = new Set<ReminderListener>()
const errorListeners = new Set<ReminderErrorListener>()

function emitChange() {
  const reminders = useReminderStore.getState().reminders
  listeners.forEach((listener) => listener(reminders))
}

function emitError(error: Error) {
  errorListeners.forEach((listener) => listener(error))
}

function createReminderId() {
  return `reminder_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}

export function createReminderService() {
  let visibilitySubscribed = false

  function ensureVisibilityWatcher() {
    if (visibilitySubscribed) return
    visibilitySubscribed = true
    visibilityWatcher.subscribe((state) => {
      if (state === 'visible') {
        void processDueReminders()
      }
    })
  }

  async function processDueReminders() {
    const now = Date.now()
    const reminders = useReminderStore.getState().reminders

    for (const reminder of reminders) {
      if (!reminder.enabled || reminder.state === 'dismissed') continue
      if (new Date(reminder.fireAt).getTime() > now) continue

      try {
        await notificationBridge.showNative({
          title: 'Task Reminder',
          body: `Task ${reminder.taskId} is due soon`,
        })
      } catch (error) {
        notificationBridge.showToast({
          title: 'Task Reminder',
          body: `Task ${reminder.taskId} is due soon`,
        })
        emitError(error instanceof Error ? error : new Error('Failed to show reminder notification'))
      }

      useReminderStore.getState().updateState(reminder.id, 'fired')
    }

    emitChange()
  }

  return {
    schedule(config: Omit<ReminderConfigRef, 'id'> & { id?: string }) {
      ensureVisibilityWatcher()
      const reminder = useReminderStore.getState().schedule({
        ...config,
        id: config.id ?? createReminderId(),
      })
      emitChange()
      return reminder
    },
    snooze(id: string, minutes = 10) {
      const current = useReminderStore.getState().reminders.find((item) => item.id === id)
      if (!current) return
      useReminderStore.getState().updateReminder(id, {
        fireAt: new Date(Date.now() + minutes * 60_000).toISOString(),
      })
      useReminderStore.getState().updateState(id, 'snoozed')
      emitChange()
    },
    dismiss(id: string) {
      useReminderStore.getState().updateState(id, 'dismissed')
      emitChange()
    },
    updateState(id: string, state: ReminderSnapshot['state']) {
      useReminderStore.getState().updateState(id, state)
      emitChange()
    },
    processDue: processDueReminders,
    onChange(listener: ReminderListener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    onError(listener: ReminderErrorListener) {
      errorListeners.add(listener)
      return () => errorListeners.delete(listener)
    },
  }
}
