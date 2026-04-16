import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { TaskRecord, TaskDraft, TaskPatch, computeQuadrant, createTaskId } from '../models/task'
import { TaskFilter, TaskSort } from '../models/task'

export interface TaskState {
  tasks: TaskRecord[]
  filters: TaskFilter
  sort: TaskSort
  addTask: (draft: TaskDraft) => TaskRecord
  updateTask: (id: string, patch: TaskPatch) => void
  removeTask: (id: string) => void
  setFilter: (filter: Partial<TaskFilter>) => void
  setSort: (sort: TaskSort) => void
  hydrate: (records: TaskRecord[]) => void
  clear: () => void
}

const defaultSort: TaskSort = { field: 'createdAt', direction: 'desc' }

export const useTaskStore = create<TaskState>()(
  devtools((set) => ({
    tasks: [],
    filters: {},
    sort: defaultSort,
    addTask: (draft) => {
      const now = new Date().toISOString()
      const estimatedDays = draft.estimatedDays ?? 1
      const todayZeroHour = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z')
      const startDate = todayZeroHour.toISOString()
      const dueDate = new Date(todayZeroHour.getTime() + estimatedDays * 24 * 60 * 60 * 1000).toISOString()

      const newRecord: TaskRecord = {
        id: createTaskId(),
        title: draft.title,
        description: draft.description,
        importance: draft.importance,
        urgency: draft.urgency,
        quadrant: computeQuadrant(draft.importance, draft.urgency),
        status: 'todo',
        startDate: startDate,
        estimatedDays: estimatedDays,
        dueDate: draft.dueDate ?? dueDate,
        tags: draft.tags ?? [],
        reminders: [],
        stats: { snoozeCount: 0 },
        createdAt: now,
        updatedAt: now,
      }
      set((state) => ({ tasks: [...state.tasks, newRecord] }))
      return newRecord
    },
    updateTask: (id, patch) =>
      set((state) => ({
        tasks: state.tasks.map((task) => {
          if (task.id !== id) return task
          const updated: TaskRecord = {
            ...task,
            ...patch,
            quadrant:
              patch.importance !== undefined || patch.urgency !== undefined
                ? computeQuadrant(patch.importance ?? task.importance, patch.urgency ?? task.urgency)
                : task.quadrant,
            updatedAt: new Date().toISOString(),
            stats:
              patch.status === 'completed' && task.status !== 'completed'
                ? { ...task.stats, completedAt: new Date().toISOString() }
                : task.stats,
          }
          return updated
        }),
      })),
    removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),
    setFilter: (filter) => set((state) => ({ filters: { ...state.filters, ...filter } })),
    setSort: (sort) => set({ sort }),
    hydrate: (records) => set({ tasks: records }),
    clear: () => set({ tasks: [] }),
  }))
)
