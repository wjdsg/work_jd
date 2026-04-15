import { createStorageAdapter } from '../storage/storageAdapter'
import { useReminderStore } from '../store/reminderStore'
import { useSettingsStore } from '../store/settingsStore'
import { useTaskStore } from '../store/taskStore'
import type { ReminderSnapshot } from '../models/reminder'
import type { UserSettings } from '../models/settings'
import type { TaskRecord } from '../models/task'

const storage = createStorageAdapter()

function storageAvailable() {
  return typeof indexedDB !== 'undefined'
}

export interface BackupPayload {
  tasks: TaskRecord[]
  reminders: ReminderSnapshot[]
  settings: UserSettings
  checksum: string
}

export interface ImportReport {
  ok: boolean
  taskCount: number
  reminderCount: number
  warnings: string[]
}

function checksumFor(input: Omit<BackupPayload, 'checksum'>) {
  const raw = JSON.stringify(input)
  let hash = 0
  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash + raw.charCodeAt(index) * (index + 1)) % 2147483647
  }
  return String(hash)
}

export function createBackupService() {
  return {
    async exportJSON() {
      const tasks = storageAvailable() ? await storage.readAllTasks() : useTaskStore.getState().tasks
      const reminders = storageAvailable() ? await storage.readAllReminders() : useReminderStore.getState().reminders
      const settings = useSettingsStore.getState().settings
      const payloadWithoutChecksum = { tasks, reminders, settings }
      const payload: BackupPayload = {
        ...payloadWithoutChecksum,
        checksum: checksumFor(payloadWithoutChecksum),
      }
      return JSON.stringify(payload, null, 2)
    },
    async exportCSV() {
      const tasks = storageAvailable() ? await storage.readAllTasks() : useTaskStore.getState().tasks
      const header = 'id,title,quadrant,status,importance,urgency,dueDate'
      const lines = tasks.map((task) => {
        return [
          task.id,
          JSON.stringify(task.title),
          task.quadrant,
          task.status,
          String(task.importance),
          String(task.urgency),
          task.dueDate ?? '',
        ].join(',')
      })
      return [header, ...lines].join('\n')
    },
    async importJSON(raw: string): Promise<ImportReport> {
      const parsed = JSON.parse(raw) as Partial<BackupPayload>
      const tasks = parsed.tasks ?? []
      const reminders = parsed.reminders ?? []
      const settings = parsed.settings ?? useSettingsStore.getState().settings
      const payloadWithoutChecksum = { tasks, reminders, settings }
      const expectedChecksum = checksumFor(payloadWithoutChecksum)
      const warnings: string[] = []

      if (!Array.isArray(tasks) || !Array.isArray(reminders)) {
        throw new Error('Invalid backup format')
      }

      if (!parsed.checksum || parsed.checksum !== expectedChecksum) {
        warnings.push('Checksum mismatch, imported with caution')
      }

      useTaskStore.getState().hydrate(tasks)
      useReminderStore.getState().hydrate(reminders)
      useSettingsStore.getState().setSettings(settings)

      if (storageAvailable()) {
        for (const task of tasks) {
          await storage.writeTask(task)
        }
        for (const reminder of reminders) {
          await storage.writeReminder(reminder)
        }
        await storage.writeSettings(useSettingsStore.getState().settings)
      }

      return {
        ok: true,
        taskCount: tasks.length,
        reminderCount: reminders.length,
        warnings,
      }
    },
  }
}
