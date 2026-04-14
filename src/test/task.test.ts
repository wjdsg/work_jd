// Author: mjw
// Date: 2026-04-13

import { describe, it, expect } from 'vitest'
import {
  Quadrant,
  TaskPriority,
  TaskStatus,
  calculateQuadrant,
  createTask,
  updateTask,
  getQuadrantLabel,
  getQuadrantColor,
} from '../models/task'

describe('Task Model', () => {
  describe('calculateQuadrant', () => {
    it('should return ImportantUrgent for high importance and high urgency', () => {
      const result = calculateQuadrant(TaskPriority.High, TaskPriority.High)
      expect(result).toBe(Quadrant.ImportantUrgent)
    })

    it('should return ImportantNotUrgent for high importance and low urgency', () => {
      const result = calculateQuadrant(TaskPriority.High, TaskPriority.Low)
      expect(result).toBe(Quadrant.ImportantNotUrgent)
    })

    it('should return NotImportantUrgent for low importance and high urgency', () => {
      const result = calculateQuadrant(TaskPriority.Low, TaskPriority.High)
      expect(result).toBe(Quadrant.NotImportantUrgent)
    })

    it('should return NotImportantNotUrgent for low importance and low urgency', () => {
      const result = calculateQuadrant(TaskPriority.Low, TaskPriority.Low)
      expect(result).toBe(Quadrant.NotImportantNotUrgent)
    })

    it('should treat Medium as important and urgent threshold', () => {
      expect(calculateQuadrant(TaskPriority.Medium, TaskPriority.Medium)).toBe(Quadrant.ImportantUrgent)
      expect(calculateQuadrant(TaskPriority.Medium, TaskPriority.Low)).toBe(Quadrant.ImportantNotUrgent)
      expect(calculateQuadrant(TaskPriority.Low, TaskPriority.Medium)).toBe(Quadrant.NotImportantUrgent)
    })
  })

  describe('createTask', () => {
    it('should create a task with all required fields', () => {
      const input = {
        title: 'Test Task',
        importance: TaskPriority.High,
        urgency: TaskPriority.Medium,
      }

      const task = createTask(input)

      expect(task.id).toBeDefined()
      expect(task.id.startsWith('task-')).toBe(true)
      expect(task.title).toBe('Test Task')
      expect(task.importance).toBe(TaskPriority.High)
      expect(task.urgency).toBe(TaskPriority.Medium)
      expect(task.quadrant).toBe(Quadrant.ImportantUrgent)
      expect(task.status).toBe(TaskStatus.Todo)
      expect(task.createdAt).toBeInstanceOf(Date)
      expect(task.updatedAt).toBeInstanceOf(Date)
      expect(task.tags).toEqual([])
    })

    it('should create a task with optional fields', () => {
      const deadline = new Date('2026-12-31')
      const reminder = new Date('2026-12-30')
      const input = {
        title: 'Test Task',
        description: 'Test Description',
        importance: TaskPriority.High,
        urgency: TaskPriority.Low,
        deadline,
        reminder,
        tags: ['work', 'important'],
      }

      const task = createTask(input)

      expect(task.description).toBe('Test Description')
      expect(task.deadline).toEqual(deadline)
      expect(task.reminder).toEqual(reminder)
      expect(task.tags).toEqual(['work', 'important'])
    })
  })

  describe('updateTask', () => {
    it('should update task fields', () => {
      const originalTask = createTask({
        title: 'Original Task',
        importance: TaskPriority.Medium,
        urgency: TaskPriority.Medium,
      })

      const updatedTask = updateTask(originalTask, {
        title: 'Updated Task',
        importance: TaskPriority.High,
      })

      expect(updatedTask.title).toBe('Updated Task')
      expect(updatedTask.importance).toBe(TaskPriority.High)
      expect(updatedTask.quadrant).toBe(Quadrant.ImportantUrgent)
      expect(updatedTask.updatedAt.getTime()).toBeGreaterThanOrEqual(originalTask.updatedAt.getTime())
    })

    it('should set completedAt when status changes to Completed', () => {
      const task = createTask({
        title: 'Test Task',
        importance: TaskPriority.Medium,
        urgency: TaskPriority.Medium,
      })

      const updatedTask = updateTask(task, { status: TaskStatus.Completed })

      expect(updatedTask.status).toBe(TaskStatus.Completed)
      expect(updatedTask.completedAt).toBeInstanceOf(Date)
    })

    it('should not set completedAt if task was already completed', () => {
      const task = createTask({
        title: 'Test Task',
        importance: TaskPriority.Medium,
        urgency: TaskPriority.Medium,
      })
      const completedTask = updateTask(task, { status: TaskStatus.Completed })

      const updatedTask = updateTask(completedTask, { title: 'New Title' })

      expect(updatedTask.completedAt).toEqual(completedTask.completedAt)
    })

    it('should recalculate quadrant when importance or urgency changes', () => {
      const task = createTask({
        title: 'Test Task',
        importance: TaskPriority.High,
        urgency: TaskPriority.High,
      })

      expect(task.quadrant).toBe(Quadrant.ImportantUrgent)

      const updatedTask = updateTask(task, { urgency: TaskPriority.Low })

      expect(updatedTask.quadrant).toBe(Quadrant.ImportantNotUrgent)
    })
  })

  describe('getQuadrantLabel', () => {
    it('should return correct Chinese labels for each quadrant', () => {
      expect(getQuadrantLabel(Quadrant.ImportantUrgent)).toBe('重要且紧急')
      expect(getQuadrantLabel(Quadrant.ImportantNotUrgent)).toBe('重要不紧急')
      expect(getQuadrantLabel(Quadrant.NotImportantUrgent)).toBe('紧急不重要')
      expect(getQuadrantLabel(Quadrant.NotImportantNotUrgent)).toBe('不重要不紧急')
    })
  })

  describe('getQuadrantColor', () => {
    it('should return unique colors for each quadrant', () => {
      const colors = [
        getQuadrantColor(Quadrant.ImportantUrgent),
        getQuadrantColor(Quadrant.ImportantNotUrgent),
        getQuadrantColor(Quadrant.NotImportantUrgent),
        getQuadrantColor(Quadrant.NotImportantNotUrgent),
      ]

      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(4)
    })
  })
})