// Author: mjw
// Date: 2026-04-13

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskFilter,
  TaskSort,
  createTask,
  updateTask,
} from '../models/task'

interface TaskDBSchema extends DBSchema {
  tasks: {
    key: string
    value: Task
    indexes: {
      'by-quadrant': string
      'by-status': string
      'by-deadline': Date
      'by-created': Date
      'by-updated': Date
    }
  }
}

const DB_NAME = 'core-matrix-db'
const DB_VERSION = 1

export class TaskRepository {
  private db: IDBPDatabase<TaskDBSchema> | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this.initDB()
    await this.initPromise
  }

  private async initDB(): Promise<void> {
    this.db = await openDB<TaskDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
        taskStore.createIndex('by-quadrant', 'quadrant')
        taskStore.createIndex('by-status', 'status')
        taskStore.createIndex('by-deadline', 'deadline')
        taskStore.createIndex('by-created', 'createdAt')
        taskStore.createIndex('by-updated', 'updatedAt')
      },
    })
  }

  private async getDB(): Promise<IDBPDatabase<TaskDBSchema>> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  async create(input: TaskCreateInput): Promise<Task> {
    const db = await this.getDB()
    const task = createTask(input)
    await db.put('tasks', task)
    return task
  }

  async getById(id: string): Promise<Task | undefined> {
    const db = await this.getDB()
    return db.get('tasks', id)
  }

  async getAll(): Promise<Task[]> {
    const db = await this.getDB()
    return db.getAll('tasks')
  }

  async update(id: string, input: TaskUpdateInput): Promise<Task | undefined> {
    const db = await this.getDB()
    const existingTask = await db.get('tasks', id)
    if (!existingTask) return undefined

    const updatedTask = updateTask(existingTask, input)
    await db.put('tasks', updatedTask)
    return updatedTask
  }

  async delete(id: string): Promise<boolean> {
    const db = await this.getDB()
    const existingTask = await db.get('tasks', id)
    if (!existingTask) return false

    await db.delete('tasks', id)
    return true
  }

  async query(filter?: TaskFilter, sort?: TaskSort): Promise<Task[]> {
    let tasks = await this.getAll()

    if (filter) {
      tasks = this.applyFilter(tasks, filter)
    }

    if (sort) {
      tasks = this.applySort(tasks, sort)
    }

    return tasks
  }

  private applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
    return tasks.filter((task) => {
      if (filter.quadrant && task.quadrant !== filter.quadrant) return false
      if (filter.status && task.status !== filter.status) return false
      if (filter.importance !== undefined && task.importance !== filter.importance) return false
      if (filter.urgency !== undefined && task.urgency !== filter.urgency) return false
      if (filter.deadlineFrom && task.deadline && task.deadline < filter.deadlineFrom) return false
      if (filter.deadlineTo && task.deadline && task.deadline > filter.deadlineTo) return false
      if (filter.tags && filter.tags.length > 0) {
        if (!task.tags || !filter.tags.some((tag) => task.tags!.includes(tag))) {
          return false
        }
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase()
        const titleMatch = task.title.toLowerCase().includes(query)
        const descMatch = task.description?.toLowerCase().includes(query) ?? false
        if (!titleMatch && !descMatch) return false
      }
      return true
    })
  }

  private applySort(tasks: Task[], sort: TaskSort): Task[] {
    return [...tasks].sort((a, b) => {
      let valueA: string | number | Date | undefined
      let valueB: string | number | Date | undefined

      switch (sort.field) {
        case 'createdAt':
          valueA = a.createdAt.getTime()
          valueB = b.createdAt.getTime()
          break
        case 'updatedAt':
          valueA = a.updatedAt.getTime()
          valueB = b.updatedAt.getTime()
          break
        case 'deadline':
          valueA = a.deadline?.getTime() ?? 0
          valueB = b.deadline?.getTime() ?? 0
          break
        case 'importance':
          valueA = a.importance
          valueB = b.importance
          break
        case 'urgency':
          valueA = a.urgency
          valueB = b.urgency
          break
        case 'title':
          valueA = a.title.toLowerCase()
          valueB = b.title.toLowerCase()
          break
      }

      if (valueA === undefined && valueB === undefined) return 0
      if (valueA === undefined) return 1
      if (valueB === undefined) return -1

      if (valueA < valueB) return sort.direction === 'asc' ? -1 : 1
      if (valueA > valueB) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  async getByQuadrant(quadrant: string): Promise<Task[]> {
    const db = await this.getDB()
    return db.getAllFromIndex('tasks', 'by-quadrant', quadrant)
  }

  async getByStatus(status: string): Promise<Task[]> {
    const db = await this.getDB()
    return db.getAllFromIndex('tasks', 'by-status', status)
  }

  async clear(): Promise<void> {
    const db = await this.getDB()
    await db.clear('tasks')
  }

  async count(filter?: TaskFilter): Promise<number> {
    const tasks = await this.query(filter)
    return tasks.length
  }
}

export const taskRepository = new TaskRepository()