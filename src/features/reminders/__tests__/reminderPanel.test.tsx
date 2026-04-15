// Author: mjw
// Date: 2026-04-15

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import RemindersView from '../RemindersPlaceholder'
import { useReminderStore } from '../../../store/reminderStore'

describe('ReminderPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T09:00:00.000Z'))
    useReminderStore.getState().clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders today and upcoming reminders', () => {
    useReminderStore.getState().schedule({
      id: 'r_today',
      taskId: 'task_today',
      minutesBefore: 10,
      fireAt: '2026-04-15T09:05:00.000Z',
      channel: 'in-app',
      enabled: true,
    })
    useReminderStore.getState().schedule({
      id: 'r_upcoming',
      taskId: 'task_upcoming',
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

    fireEvent.click(screen.getByRole('button', { name: /snooze r_snooze/i }))
    const snoozedReminder = useReminderStore.getState().reminders.find((item) => item.id === 'r_snooze')
    expect(snoozedReminder?.state).toBe('snoozed')

    fireEvent.click(screen.getByRole('button', { name: /dismiss r_snooze/i }))

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

    expect(screen.getByText(/browser was sleeping/i)).toBeInTheDocument()
  })
})
