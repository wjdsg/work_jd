import { openDB, IDBPDatabase } from 'idb'
import { DEFAULT_SETTINGS } from '../models/settings'

type WorkspaceDB = IDBPDatabase<unknown>

const DB_NAME = 'importance-urgency-db'
const DB_VERSION = 1

export async function getDB(): Promise<WorkspaceDB> {
  return openDB(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
        taskStore.createIndex('byQuadrant', 'quadrant')
        taskStore.createIndex('byDueDate', 'dueDate')
        taskStore.createIndex('byUpdatedAt', 'updatedAt')
        const reminderStore = db.createObjectStore('reminders', { keyPath: 'id' })
        reminderStore.createIndex('byFireAt', 'fireAt')
        db.createObjectStore('metadata', { keyPath: 'key' })
        const metadataStore = db.transaction('metadata', 'readwrite').objectStore('metadata')
        await metadataStore.put({ key: 'singleton', schemaVersion: 1, settings: DEFAULT_SETTINGS })
      }
    },
  })
}
