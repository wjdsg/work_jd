import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTaskStore } from '../taskStore'

describe('useTaskStore', () => {
  beforeEach(() => {
    useTaskStore.getState().clear()
    vi.useRealTimers()
  })

  it('creates a task from draft', () => {
    const record = useTaskStore.getState().addTask({
      title: 'Test Task',
      importance: 10,
      urgency: 10,
      tags: ['test'],
    })
    expect(record.id).toMatch(/task_/)
    expect(useTaskStore.getState().tasks).toHaveLength(1)
  })

  it('uses 1-10 threshold semantics for default quadrant calculation', () => {
    const record = useTaskStore.getState().addTask({
      title: 'Threshold Task',
      importance: 5,
      urgency: 5,
      tags: [],
    })

    expect(record.quadrant).toBe('q4')
  })

  it('assigns default dueDate when draft does not provide one', () => {
    const record = useTaskStore.getState().addTask({
      title: 'Deadline default task',
      importance: 8,
      urgency: 8,
      tags: [],
    })

    expect(record.dueDate).toBeTruthy()
  })

  it('adds startDate and estimatedDays to task model', () => {
    const record = useTaskStore.getState().addTask({
      title: 'New Task with Duration',
      importance: 8,
      urgency: 8,
      estimatedDays: 5,
      tags: [],
    })

    expect(record.startDate).toBeTruthy()
    expect(record.estimatedDays).toBe(5)
    expect(record.dueDate).toBeTruthy()
  })

  it('calculates startDate and dueDate from estimatedDays', () => {
    vi.setSystemTime(new Date('2026-04-16T12:00:00.000Z'))

    const record = useTaskStore.getState().addTask({
      title: 'Duration Task',
      importance: 8,
      urgency: 8,
      estimatedDays: 3,
      tags: [],
    })

    expect(record.startDate).toMatch(/^2026-04-16T00:00:00\.000Z$/)
    expect(record.dueDate).toMatch(/^2026-04-19T00:00:00\.000Z$/)
    expect(record.estimatedDays).toBe(3)
  })
})
