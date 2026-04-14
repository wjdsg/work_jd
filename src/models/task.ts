// Author: mjw
// Date: 2026-04-13

export enum Quadrant {
  ImportantUrgent = 'important-urgent',
  ImportantNotUrgent = 'important-not-urgent',
  NotImportantUrgent = 'not-important-urgent',
  NotImportantNotUrgent = 'not-important-not-urgent',
}

export enum TaskPriority {
  Low = 1,
  Medium = 2,
  High = 3,
}

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in-progress',
  Completed = 'completed',
  Archived = 'archived',
}

export interface Task {
  id: string
  title: string
  description?: string
  importance: TaskPriority
  urgency: TaskPriority
  quadrant: Quadrant
  status: TaskStatus
  deadline?: Date
  reminder?: Date
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface TaskCreateInput {
  title: string
  description?: string
  importance: TaskPriority
  urgency: TaskPriority
  deadline?: Date
  reminder?: Date
  tags?: string[]
}

export interface TaskUpdateInput {
  title?: string
  description?: string
  importance?: TaskPriority
  urgency?: TaskPriority
  status?: TaskStatus
  deadline?: Date
  reminder?: Date
  tags?: string[]
}

export interface TaskFilter {
  quadrant?: Quadrant
  status?: TaskStatus
  importance?: TaskPriority
  urgency?: TaskPriority
  tags?: string[]
  searchQuery?: string
  deadlineFrom?: Date
  deadlineTo?: Date
}

export type TaskSortField = 'createdAt' | 'updatedAt' | 'deadline' | 'importance' | 'urgency' | 'title'

export type SortDirection = 'asc' | 'desc'

export interface TaskSort {
  field: TaskSortField
  direction: SortDirection
}

export function calculateQuadrant(importance: TaskPriority, urgency: TaskPriority): Quadrant {
  const isImportant = importance >= TaskPriority.Medium
  const isUrgent = urgency >= TaskPriority.Medium

  if (isImportant && isUrgent) {
    return Quadrant.ImportantUrgent
  } else if (isImportant && !isUrgent) {
    return Quadrant.ImportantNotUrgent
  } else if (!isImportant && isUrgent) {
    return Quadrant.NotImportantUrgent
  } else {
    return Quadrant.NotImportantNotUrgent
  }
}

export function createTask(input: TaskCreateInput): Task {
  const now = new Date()
  return {
    id: generateTaskId(),
    title: input.title,
    description: input.description,
    importance: input.importance,
    urgency: input.urgency,
    quadrant: calculateQuadrant(input.importance, input.urgency),
    status: TaskStatus.Todo,
    deadline: input.deadline,
    reminder: input.reminder,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  }
}

export function updateTask(task: Task, input: TaskUpdateInput): Task {
  const now = new Date()
  const updatedTask: Task = {
    ...task,
    ...input,
    updatedAt: now,
  }

  if (input.importance !== undefined || input.urgency !== undefined) {
    updatedTask.quadrant = calculateQuadrant(
      input.importance ?? task.importance,
      input.urgency ?? task.urgency
    )
  }

  if (input.status === TaskStatus.Completed && task.status !== TaskStatus.Completed) {
    updatedTask.completedAt = now
  }

  return updatedTask
}

export function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getQuadrantLabel(quadrant: Quadrant): string {
  const labels: Record<Quadrant, string> = {
    [Quadrant.ImportantUrgent]: '重要且紧急',
    [Quadrant.ImportantNotUrgent]: '重要不紧急',
    [Quadrant.NotImportantUrgent]: '紧急不重要',
    [Quadrant.NotImportantNotUrgent]: '不重要不紧急',
  }
  return labels[quadrant]
}

export function getQuadrantColor(quadrant: Quadrant): string {
  const colors: Record<Quadrant, string> = {
    [Quadrant.ImportantUrgent]: '#ff4444',
    [Quadrant.ImportantNotUrgent]: '#44aaff',
    [Quadrant.NotImportantUrgent]: '#ffaa44',
    [Quadrant.NotImportantNotUrgent]: '#888888',
  }
  return colors[quadrant]
}