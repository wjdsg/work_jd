// Author: mjw
// Date: 2026-04-17

import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useTaskStore } from '../../store/taskStore'
import { useReminderStore } from '../../store/reminderStore'
import { useTaskReminderSync } from '../useTaskReminderSync'

function HookHost() {
  useTaskReminderSync()
  return null
}

describe('useTaskReminderSync', () => {
  beforeEach(() => {
    useTaskStore.getState().clear()
    useReminderStore.getState().clear()
  })

  it('creates reminder from task due date and marks it dismissed after completion', () => {
    const task = useTaskStore.getState().addTask({
      title: '联动任务',
      importance: 8,
      urgency: 8,
      dueDate: '2026-05-01T10:00:00.000Z',
      tags: [],
    })

    render(<HookHost />)

    const linked = useReminderStore.getState().reminders.find((item) => item.taskId === task.id)
    expect(linked).toBeDefined()

    useTaskStore.getState().updateTask(task.id, { status: 'completed' })

    const afterCompleted = useReminderStore.getState().reminders.find((item) => item.taskId === task.id)
    expect(afterCompleted?.state).toBe('dismissed')
  })

  it('creates dismissed reminder for completed task that had no prior reminder', () => {
    const task = useTaskStore.getState().addTask({
      title: '先完成再联动',
      importance: 8,
      urgency: 8,
      dueDate: '2026-05-02T09:00:00.000Z',
      tags: [],
    })
    useTaskStore.getState().updateTask(task.id, { status: 'completed' })

    render(<HookHost />)

    const linked = useReminderStore.getState().reminders.find((item) => item.taskId === task.id)
    expect(linked?.state).toBe('dismissed')
  })
})
