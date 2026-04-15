import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ReminderSnapshot, ReminderConfigRef } from '../models/reminder'

export interface ReminderState {
  reminders: ReminderSnapshot[]
  hydrate: (records: ReminderSnapshot[]) => void
  schedule: (config: ReminderConfigRef) => ReminderSnapshot
  updateReminder: (id: string, patch: Partial<ReminderSnapshot>) => void
  updateState: (id: string, state: ReminderSnapshot['state']) => void
  remove: (id: string) => void
  clear: () => void
}

export const useReminderStore = create<ReminderState>()(
  devtools((set) => ({
    reminders: [],
    hydrate: (records) => set({ reminders: records }),
    schedule: (config) => {
      const reminder: ReminderSnapshot = { ...config, state: 'scheduled', snoozeCount: 0 }
      set((state) => ({ reminders: [...state.reminders, reminder] }))
      return reminder
    },
    updateReminder: (id, patch) =>
      set((state) => ({
        reminders: state.reminders.map((reminder) => (reminder.id === id ? { ...reminder, ...patch } : reminder)),
      })),
    updateState: (id, state) =>
      set((stateStore) => ({
        reminders: stateStore.reminders.map((reminder) =>
          reminder.id === id
            ? {
                ...reminder,
                state,
                snoozeCount: state === 'snoozed' ? reminder.snoozeCount + 1 : reminder.snoozeCount,
              }
            : reminder
        ),
      })),
    remove: (id) => set((state) => ({ reminders: state.reminders.filter((reminder) => reminder.id !== id) })),
    clear: () => set({ reminders: [] }),
  }))
)
