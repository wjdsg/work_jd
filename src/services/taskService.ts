import { useTaskStore } from '../store/taskStore'
import { TaskDraft, TaskPatch } from '../models/task'

export function createTaskService() {
  return {
    create(draft: TaskDraft) {
      return useTaskStore.getState().addTask(draft)
    },
    update(id: string, patch: TaskPatch) {
      useTaskStore.getState().updateTask(id, patch)
    },
    remove(id: string) {
      useTaskStore.getState().removeTask(id)
    },
  }
}
