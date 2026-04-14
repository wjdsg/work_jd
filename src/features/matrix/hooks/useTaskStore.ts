// Author: mjw
// Date: 2026-04-13

import { useState, useEffect, useCallback } from 'react'
import {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskFilter,
  TaskSort,
  Quadrant,
} from '@/models/task'
import { taskRepository } from '@/services/taskRepository'

interface TaskStore {
  tasks: Task[]
  loading: boolean
  error: Error | null
  createTask: (input: TaskCreateInput) => Promise<Task>
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task | undefined>
  deleteTask: (id: string) => Promise<boolean>
  moveTask: (id: string, quadrant: Quadrant) => Promise<Task | undefined>
  refreshTasks: () => Promise<void>
  getTasksByQuadrant: (quadrant: Quadrant) => Task[]
  queryTasks: (filter?: TaskFilter, sort?: TaskSort) => Promise<Task[]>
}

export function useTaskStore(): TaskStore {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const allTasks = await taskRepository.getAll()
      setTasks(allTasks)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tasks'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshTasks()
  }, [refreshTasks])

  const createTaskHandler = useCallback(async (input: TaskCreateInput): Promise<Task> => {
    const task = await taskRepository.create(input)
    setTasks((prev) => [...prev, task])
    return task
  }, [])

  const updateTaskHandler = useCallback(
    async (id: string, input: TaskUpdateInput): Promise<Task | undefined> => {
      const updatedTask = await taskRepository.update(id, input)
      if (updatedTask) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)))
      }
      return updatedTask
    },
    []
  )

  const deleteTaskHandler = useCallback(async (id: string): Promise<boolean> => {
    const success = await taskRepository.delete(id)
    if (success) {
      setTasks((prev) => prev.filter((t) => t.id !== id))
    }
    return success
  }, [])

  const moveTaskHandler = useCallback(
    async (id: string, quadrant: Quadrant): Promise<Task | undefined> => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return undefined

      const importanceMapping: Record<Quadrant, { importance: number; urgency: number }> = {
        [Quadrant.ImportantUrgent]: { importance: 3, urgency: 3 },
        [Quadrant.ImportantNotUrgent]: { importance: 3, urgency: 1 },
        [Quadrant.NotImportantUrgent]: { importance: 1, urgency: 3 },
        [Quadrant.NotImportantNotUrgent]: { importance: 1, urgency: 1 },
      }

      const mapping = importanceMapping[quadrant]
      return updateTaskHandler(id, {
        importance: mapping.importance,
        urgency: mapping.urgency,
      })
    },
    [tasks, updateTaskHandler]
  )

  const getTasksByQuadrant = useCallback(
    (quadrant: Quadrant): Task[] => {
      return tasks.filter((t) => t.quadrant === quadrant)
    },
    [tasks]
  )

  const queryTasks = useCallback(
    async (filter?: TaskFilter, sort?: TaskSort): Promise<Task[]> => {
      return taskRepository.query(filter, sort)
    },
    []
  )

  return {
    tasks,
    loading,
    error,
    createTask: createTaskHandler,
    updateTask: updateTaskHandler,
    deleteTask: deleteTaskHandler,
    moveTask: moveTaskHandler,
    refreshTasks,
    getTasksByQuadrant,
    queryTasks,
  }
}