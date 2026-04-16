import { useEffect } from 'react'
import { createStorageAdapter } from '../storage/storageAdapter'
import { useTaskStore } from '../store/taskStore'
import { useSettingsStore } from '../store/settingsStore'

const storage = createStorageAdapter()

export function usePersistentStore() {
  useEffect(() => {
    async function hydrate() {
      const tasks = await storage.readAllTasks()
      const settings = await storage.readSettings()
      useTaskStore.getState().hydrate(tasks)
      useSettingsStore.getState().setSettings(settings)
    }
    hydrate()
    const unsubscribeTasks = useTaskStore.subscribe((state) => {
      state.tasks.forEach((task) => {
        storage.writeTask(task)
      })
    })

    const unsubscribeSettings = useSettingsStore.subscribe((state) => {
      storage.writeSettings(state.settings)
    })

    return () => {
      unsubscribeTasks()
      unsubscribeSettings()
    }
  }, [])
}
