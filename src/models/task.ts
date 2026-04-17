export type QuadrantId = 'q1' | 'q2' | 'q3' | 'q4'

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'archived'

export interface TaskRecord {
  id: string
  title: string
  description?: string
  importance: number
  urgency: number
  quadrant: QuadrantId
  status: TaskStatus
  startDate: string
  estimatedDays: number
  dueDate?: string
  tags: string[]
  reminders: string[]
  stats: {
    completedAt?: string
    snoozeCount: number
  }
  createdAt: string
  updatedAt: string
}

export interface TaskDraft {
  title: string
  description?: string
  importance: number
  urgency: number
  estimatedDays?: number
  dueDate?: string
  tags?: string[]
}

export interface TaskPatch {
  title?: string
  description?: string
  importance?: number
  urgency?: number
  status?: TaskStatus
  completedAt?: string
  startDate?: string
  estimatedDays?: number
  dueDate?: string
  tags?: string[]
}

export interface TaskFilter {
  quadrant?: QuadrantId
  status?: TaskStatus
  tags?: string[]
  search?: string
}

export type TaskSortField = 'createdAt' | 'updatedAt' | 'dueDate' | 'importance' | 'urgency' | 'title'
export type SortDirection = 'asc' | 'desc'

export interface TaskSort {
  field: TaskSortField
  direction: SortDirection
}

export function computeQuadrant(importance: number, urgency: number, thresholdImportance = 6, thresholdUrgency = 6): QuadrantId {
  const important = importance >= thresholdImportance
  const urgent = urgency >= thresholdUrgency
  if (important && urgent) return 'q1'
  if (important) return 'q2'
  if (urgent) return 'q3'
  return 'q4'
}

export function createTaskId() {
  return `task_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}
