import { getDB } from './indexedDbClient'
import { TaskRecord } from '../models/task'
import { ReminderSnapshot } from '../models/reminder'
import { UserSettings } from '../models/settings'

export interface StorageAdapter {
  readAllTasks(): Promise<TaskRecord[]>
  writeTask(record: TaskRecord): Promise<void>
  deleteTask(id: string): Promise<void>
  readAllReminders(): Promise<ReminderSnapshot[]>
  writeReminder(record: ReminderSnapshot): Promise<void>
  deleteReminder(id: string): Promise<void>
  readSettings(): Promise<UserSettings>
  writeSettings(settings: UserSettings): Promise<void>
  runMigration(targetVersion: number): Promise<void>
  reset(): Promise<void>
}

export function createStorageAdapter(): StorageAdapter {
  return {
    async readAllTasks() {
      const db = await getDB()
      return db.getAll('tasks')
    },
    async writeTask(record) {
      const db = await getDB()
      await db.put('tasks', record)
    },
    async deleteTask(id) {
      const db = await getDB()
      await db.delete('tasks', id)
    },
    async readAllReminders() {
      const db = await getDB()
      return db.getAll('reminders')
    },
    async writeReminder(record) {
      const db = await getDB()
      await db.put('reminders', record)
    },
    async deleteReminder(id) {
      const db = await getDB()
      await db.delete('reminders', id)
    },
    async readSettings() {
      const db = await getDB()
      const metadata = await db.get('metadata', 'singleton')
      return metadata.settings
    },
    async writeSettings(settings) {
      const db = await getDB()
      await db.put('metadata', { key: 'singleton', schemaVersion: 1, settings })
    },
    async runMigration() {
      // migrations handled in openDB upgrade for version 1
    },
    async reset() {
      const db = await getDB()
      const tx = db.transaction(['tasks', 'reminders'], 'readwrite')
      await Promise.all([tx.objectStore('tasks').clear(), tx.objectStore('reminders').clear()])
      await tx.done
    },
  }
}
