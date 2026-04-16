import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from '../taskStore'

describe('useTaskStore', () => {
  beforeEach(() => {
    useTaskStore.getState().clear()
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
})
