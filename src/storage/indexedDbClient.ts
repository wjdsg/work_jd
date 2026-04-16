import { openDB, IDBPDatabase } from 'idb'
import { DEFAULT_SETTINGS } from '../models/settings'
import { computeQuadrant } from '../models/task'

type WorkspaceDB = IDBPDatabase<unknown>

const DB_NAME = 'importance-urgency-db'
const DB_VERSION = 3

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function migrateLegacyScale(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return 6
  }
  const normalized = clamp(Math.round(numeric), 1, 5)
  return clamp(normalized * 2, 1, 10)
}

export async function getDB(): Promise<WorkspaceDB> {
  return openDB(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
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

      if (oldVersion >= 1 && oldVersion < 2 && transaction) {
        const taskStore = transaction.objectStore('tasks')
        const metadataStore = transaction.objectStore('metadata')
        const metadata = await metadataStore.get('singleton')
        const legacySettings = metadata?.settings ?? DEFAULT_SETTINGS
        const migratedThreshold = {
          importance: migrateLegacyScale(legacySettings.quadrantThreshold?.importance),
          urgency: migrateLegacyScale(legacySettings.quadrantThreshold?.urgency),
        }

        const tasks = await taskStore.getAll()
        await Promise.all(
          tasks.map((task) => {
            const migratedImportance = migrateLegacyScale(task.importance)
            const migratedUrgency = migrateLegacyScale(task.urgency)
            return taskStore.put({
              ...task,
              importance: migratedImportance,
              urgency: migratedUrgency,
              quadrant: computeQuadrant(
                migratedImportance,
                migratedUrgency,
                migratedThreshold.importance,
                migratedThreshold.urgency,
              ),
            })
          }),
        )

        await metadataStore.put({
          key: 'singleton',
          schemaVersion: 2,
          settings: {
            ...legacySettings,
            quadrantThreshold: migratedThreshold,
          },
        })
      }

      if (oldVersion >= 2 && oldVersion < 3 && transaction) {
        const taskStore = transaction.objectStore('tasks')
        const metadataStore = transaction.objectStore('metadata')
        const metadata = await metadataStore.get('singleton')
        const legacySettings = metadata?.settings ?? DEFAULT_SETTINGS

        const tasks = await taskStore.getAll()
        const MS_PER_DAY = 1000 * 60 * 60 * 24

        await Promise.all(
          tasks.map((task) => {
            const startDate = task.startDate ?? task.createdAt
            let dueDate = task.dueDate
            let estimatedDays = task.estimatedDays

            if (!dueDate) {
              const startDateObj = new Date(startDate)
              dueDate = new Date(startDateObj.getTime() + MS_PER_DAY).toISOString()
            }

            if (estimatedDays === undefined || estimatedDays === null) {
              const startDateObj = new Date(startDate)
              const dueDateObj = new Date(dueDate!)
              const diffMs = dueDateObj.getTime() - startDateObj.getTime()
              estimatedDays = Math.max(1, Math.ceil(diffMs / MS_PER_DAY))
            }

            return taskStore.put({
              ...task,
              startDate,
              dueDate,
              estimatedDays,
            })
          }),
        )

        await metadataStore.put({
          key: 'singleton',
          schemaVersion: 3,
          settings: legacySettings,
        })
      }
    },
  })
}
