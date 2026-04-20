// Author: mjw
// Date: 2026-04-15

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import RemindersView from '../RemindersPlaceholder'
import { useReminderStore } from '../../../store/reminderStore'
import { useTaskStore } from '../../../store/taskStore'

describe('ReminderPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T09:00:00.000Z'))
    useReminderStore.getState().clear()
    useTaskStore.getState().clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders today and upcoming reminders', () => {
    const taskToday = useTaskStore.getState().addTask({
      title: 'task_today',
      importance: 8,
      urgency: 8,
      dueDate: '2026-04-15T09:05:00.000Z',
      tags: [],
    })
    const taskUpcoming = useTaskStore.getState().addTask({
      title: 'task_upcoming',
      importance: 8,
      urgency: 8,
      dueDate: '2026-04-16T09:00:00.000Z',
      tags: [],
    })

    useReminderStore.getState().schedule({
      id: 'r_today',
      taskId: taskToday.id,
      minutesBefore: 10,
      fireAt: '2026-04-15T09:05:00.000Z',
      channel: 'in-app',
      enabled: true,
    })
    useReminderStore.getState().schedule({
      id: 'r_upcoming',
      taskId: taskUpcoming.id,
      minutesBefore: 15,
      fireAt: '2026-04-16T09:00:00.000Z',
      channel: 'in-app',
      enabled: true,
    })

    render(<RemindersView />)

    expect(screen.getByText(/task_today/i)).toBeInTheDocument()
    expect(screen.getByText(/task_upcoming/i)).toBeInTheDocument()
  })

  it('snoozes and dismisses reminder', () => {
    useReminderStore.getState().schedule({
      id: 'r_snooze',
      taskId: 'task_snooze',
      minutesBefore: 5,
      fireAt: '2026-04-15T09:00:00.000Z',
      channel: 'in-app',
      enabled: true,
    })

    render(<RemindersView />)

    fireEvent.click(screen.getByRole('button', { name: /稍后提醒 r_snooze/i }))
    const snoozedReminder = useReminderStore.getState().reminders.find((item) => item.id === 'r_snooze')
    expect(snoozedReminder?.state).toBe('snoozed')

    fireEvent.click(screen.getByRole('button', { name: /忽略提醒 r_snooze/i }))

    const dismissedReminder = useReminderStore.getState().reminders.find((item) => item.id === 'r_snooze')
    expect(dismissedReminder?.state).toBe('dismissed')
  })

  it('shows sleep warning when tab resumes after long hidden time', async () => {
    render(<RemindersView />)

    await act(async () => {
      await Promise.resolve()
    })

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
      vi.advanceTimersByTime(130_000)
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(screen.getByText(/浏览器休眠/i)).toBeInTheDocument()
  })

  it('keeps dismissed reminders out of today and upcoming lists', () => {
    const doneToday = useTaskStore.getState().addTask({
      title: 'task_done_today',
      importance: 8,
      urgency: 8,
      dueDate: '2026-04-15T09:10:00.000Z',
      tags: [],
    })
    const doneUpcoming = useTaskStore.getState().addTask({
      title: 'task_done_upcoming',
      importance: 8,
      urgency: 8,
      dueDate: '2026-04-16T09:10:00.000Z',
      tags: [],
    })

    useReminderStore.getState().schedule({
      id: 'r_done_today',
      taskId: doneToday.id,
      minutesBefore: 5,
      fireAt: '2026-04-15T09:10:00.000Z',
      channel: 'in-app',
      enabled: true,
    })
    useReminderStore.getState().schedule({
      id: 'r_done_upcoming',
      taskId: doneUpcoming.id,
      minutesBefore: 5,
      fireAt: '2026-04-16T09:10:00.000Z',
      channel: 'in-app',
      enabled: true,
    })
    useReminderStore.getState().updateState('r_done_today', 'dismissed')
    useReminderStore.getState().updateState('r_done_upcoming', 'dismissed')

    render(<RemindersView />)

    const todaySection = screen.getByRole('region', { name: /今日提醒/i })
    const upcomingSection = screen.getByRole('region', { name: /即将到来/i })
    const completedSection = screen.getByRole('region', { name: /已处理/i })

    expect(within(todaySection).queryByText(/task_done_today/i)).not.toBeInTheDocument()
    expect(within(upcomingSection).queryByText(/task_done_upcoming/i)).not.toBeInTheDocument()
    expect(within(completedSection).getByText(/task_done_today/i)).toBeInTheDocument()
    expect(within(completedSection).getByText(/task_done_upcoming/i)).toBeInTheDocument()
  })
})
