import { useEffect } from 'react'
import { createStorageAdapter } from '../storage/storageAdapter'
import { useTaskStore } from '../store/taskStore'

const storage = createStorageAdapter()

export function usePersistentStore() {
  useEffect(() => {
    async function hydrate() {
      const tasks = await storage.readAllTasks()
      useTaskStore.getState().hydrate(tasks)
    }
    hydrate()
    const unsubscribe = useTaskStore.subscribe((state) => {
      state.tasks.forEach((task) => {
        storage.writeTask(task)
      })
    })
    return () => unsubscribe()
  }, [])
}
