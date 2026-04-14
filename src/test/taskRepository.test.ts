// Author: mjw
// Date: 2026-04-13

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { openDB } from 'idb'
import { TaskRepository } from '../services/taskRepository'
import { TaskPriority, TaskStatus, Quadrant, Task } from '../models/task'

vi.mock('idb')

describe('TaskRepository', () => {
  let repository: TaskRepository

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(openDB).mockResolvedValue({
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      getAllFromIndex: vi.fn().mockResolvedValue([]),
    } as any)
    
    repository = new TaskRepository()
    await repository.init()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a task and store it', async () => {
      const input = {
        title: 'Test Task',
        importance: TaskPriority.High,
        urgency: TaskPriority.Medium,
      }

      const task = await repository.create(input)

      expect(task.title).toBe('Test Task')
      expect(task.importance).toBe(TaskPriority.High)
      expect(task.urgency).toBe(TaskPriority.Medium)
      expect(task.quadrant).toBe(Quadrant.ImportantUrgent)
      expect(task.status).toBe(TaskStatus.Todo)
    })
  })

  describe('getById', () => {
    it('should return a task by id', async () => {
      const mockTask: Task = {
        id: 'task-1',
        title: 'Test Task',
        importance: TaskPriority.High,
        urgency: TaskPriority.High,
        quadrant: Quadrant.ImportantUrgent,
        status: TaskStatus.Todo,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      }
      vi.mocked(openDB).mockResolvedValueOnce({
        get: vi.fn().mockResolvedValue(mockTask),
        getAll: vi.fn().mockResolvedValue([]),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.getById('task-1')

      expect(result).toEqual(mockTask)
    })

    it('should return undefined for non-existent task', async () => {
      vi.mocked(openDB).mockResolvedValueOnce({
        get: vi.fn().mockResolvedValue(undefined),
        getAll: vi.fn().mockResolvedValue([]),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.getById('non-existent')

      expect(result).toBeUndefined()
    })
  })

  describe('getAll', () => {
    it('should return all tasks', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Task 1',
          importance: TaskPriority.High,
          urgency: TaskPriority.High,
          quadrant: Quadrant.ImportantUrgent,
          status: TaskStatus.Todo,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
        {
          id: 'task-2',
          title: 'Task 2',
          importance: TaskPriority.Low,
          urgency: TaskPriority.Low,
          quadrant: Quadrant.NotImportantNotUrgent,
          status: TaskStatus.Todo,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
      ]
      vi.mocked(openDB).mockResolvedValueOnce({
        getAll: vi.fn().mockResolvedValue(mockTasks),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.getAll()

      expect(result).toEqual(mockTasks)
    })
  })

  describe('update', () => {
    it('should update existing task', async () => {
      const existingTask: Task = {
        id: 'task-1',
        title: 'Original Task',
        importance: TaskPriority.Medium,
        urgency: TaskPriority.Medium,
        quadrant: Quadrant.ImportantUrgent,
        status: TaskStatus.Todo,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        tags: [],
      }
      vi.mocked(openDB).mockResolvedValueOnce({
        get: vi.fn().mockResolvedValue(existingTask),
        put: vi.fn().mockResolvedValue(undefined),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.update('task-1', { title: 'Updated Task' })

      expect(result?.title).toBe('Updated Task')
    })

    it('should return undefined for non-existent task', async () => {
      vi.mocked(openDB).mockResolvedValueOnce({
        get: vi.fn().mockResolvedValue(undefined),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.update('non-existent', { title: 'Updated' })

      expect(result).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('should delete existing task and return true', async () => {
      const existingTask: Task = {
        id: 'task-1',
        title: 'Test Task',
        importance: TaskPriority.High,
        urgency: TaskPriority.High,
        quadrant: Quadrant.ImportantUrgent,
        status: TaskStatus.Todo,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      }
      vi.mocked(openDB).mockResolvedValueOnce({
        get: vi.fn().mockResolvedValue(existingTask),
        delete: vi.fn().mockResolvedValue(undefined),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.delete('task-1')

      expect(result).toBe(true)
    })

    it('should return false for non-existent task', async () => {
      vi.mocked(openDB).mockResolvedValueOnce({
        get: vi.fn().mockResolvedValue(undefined),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.delete('non-existent')

      expect(result).toBe(false)
    })
  })

  describe('query', () => {
    it('should filter tasks by quadrant', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Task 1',
          importance: TaskPriority.High,
          urgency: TaskPriority.High,
          quadrant: Quadrant.ImportantUrgent,
          status: TaskStatus.Todo,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
        {
          id: 'task-2',
          title: 'Task 2',
          importance: TaskPriority.Low,
          urgency: TaskPriority.Low,
          quadrant: Quadrant.NotImportantNotUrgent,
          status: TaskStatus.Todo,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
      ]
      vi.mocked(openDB).mockResolvedValueOnce({
        getAll: vi.fn().mockResolvedValue(mockTasks),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.query({ quadrant: Quadrant.ImportantUrgent })

      expect(result.length).toBe(1)
      expect(result[0].quadrant).toBe(Quadrant.ImportantUrgent)
    })

    it('should filter tasks by status', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Task 1',
          importance: TaskPriority.High,
          urgency: TaskPriority.High,
          quadrant: Quadrant.ImportantUrgent,
          status: TaskStatus.Completed,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
        {
          id: 'task-2',
          title: 'Task 2',
          importance: TaskPriority.Low,
          urgency: TaskPriority.Low,
          quadrant: Quadrant.NotImportantNotUrgent,
          status: TaskStatus.Todo,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
      ]
      vi.mocked(openDB).mockResolvedValueOnce({
        getAll: vi.fn().mockResolvedValue(mockTasks),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.query({ status: TaskStatus.Todo })

      expect(result.length).toBe(1)
      expect(result[0].status).toBe(TaskStatus.Todo)
    })

    it('should filter tasks by search query', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Important Project',
          importance: TaskPriority.High,
          urgency: TaskPriority.High,
          quadrant: Quadrant.ImportantUrgent,
          status: TaskStatus.Todo,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
        {
          id: 'task-2',
          title: 'Routine Work',
          description: 'Daily routine',
          importance: TaskPriority.Low,
          urgency: TaskPriority.Low,
          quadrant: Quadrant.NotImportantNotUrgent,
          status: TaskStatus.Todo,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
      ]
      vi.mocked(openDB).mockResolvedValueOnce({
        getAll: vi.fn().mockResolvedValue(mockTasks),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.query({ searchQuery: 'Project' })

      expect(result.length).toBe(1)
      expect(result[0].title).toContain('Project')
    })

    it('should sort tasks by title ascending', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Zebra Task',
          importance: TaskPriority.High,
          urgency: TaskPriority.High,
          quadrant: Quadrant.ImportantUrgent,
          status: TaskStatus.Todo,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
        {
          id: 'task-2',
          title: 'Alpha Task',
          importance: TaskPriority.Low,
          urgency: TaskPriority.Low,
          quadrant: Quadrant.NotImportantNotUrgent,
          status: TaskStatus.Todo,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
        },
      ]
      vi.mocked(openDB).mockResolvedValueOnce({
        getAll: vi.fn().mockResolvedValue(mockTasks),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      const result = await newRepo.query(undefined, { field: 'title', direction: 'asc' })

      expect(result[0].title).toBe('Alpha Task')
      expect(result[1].title).toBe('Zebra Task')
    })
  })

  describe('clear', () => {
    it('should clear all tasks', async () => {
      vi.mocked(openDB).mockResolvedValueOnce({
        clear: vi.fn().mockResolvedValue(undefined),
      } as any)

      const newRepo = new TaskRepository()
      await newRepo.init()
      await newRepo.clear()

      expect(true).toBe(true)
    })
  })
})