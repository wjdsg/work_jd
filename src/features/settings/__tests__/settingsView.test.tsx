// Author: mjw
// Date: 2026-04-15

import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SettingsView from '../SettingsView'
import { useSettingsStore } from '../../../store/settingsStore'
import { useTaskStore } from '../../../store/taskStore'
import { useReminderStore } from '../../../store/reminderStore'

describe('SettingsView', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset()
    useTaskStore.getState().clear()
    useReminderStore.getState().clear()
  })

  it('shows sync status and updates theme/timezone/threshold', () => {
    useSettingsStore.getState().setSyncStatus('degraded')

    render(<SettingsView />)

    expect(screen.getByText(/sync: degraded/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^theme$/i), { target: { value: 'dark' } })
    fireEvent.change(screen.getByLabelText(/^timezone$/i), { target: { value: 'Asia/Shanghai' } })
    fireEvent.change(screen.getByLabelText(/importance threshold/i), { target: { value: '5' } })

    const settings = useSettingsStore.getState().settings
    expect(settings.theme).toBe('dark')
    expect(settings.timezone).toBe('Asia/Shanghai')
    expect(settings.quadrantThreshold.importance).toBe(5)
  })

  it('exports backup and imports JSON payload', async () => {
    useTaskStore.getState().addTask({
      title: 'Backup task',
      importance: 5,
      urgency: 5,
      tags: [],
    })

    render(<SettingsView />)

    fireEvent.click(screen.getByRole('button', { name: /export json/i }))
    expect(await screen.findByText(/exported json/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /export csv/i }))
    expect(await screen.findByText(/exported csv/i)).toBeInTheDocument()

    const payload = JSON.stringify({
      tasks: [
        {
          id: 'task_imported',
          title: 'Imported Task',
          importance: 5,
          urgency: 5,
          quadrant: 'q1',
          status: 'todo',
          tags: [],
          reminders: [],
          stats: { snoozeCount: 0 },
          createdAt: '2026-04-15T00:00:00.000Z',
          updatedAt: '2026-04-15T00:00:00.000Z',
        },
      ],
      reminders: [],
      settings: useSettingsStore.getState().settings,
      checksum: 'invalid',
    })

    fireEvent.change(screen.getByLabelText(/import json/i), { target: { value: payload } })
    fireEvent.click(screen.getByRole('button', { name: /import backup/i }))

    await waitFor(() => {
      expect(useTaskStore.getState().tasks.some((task) => task.id === 'task_imported')).toBe(true)
    })
  })

  it('resets database and shows storage/clock warnings', async () => {
    Object.defineProperty(window.navigator, 'storage', {
      configurable: true,
      value: {
        estimate: async () => ({ usage: 55_000_000, quota: 60_000_000 }),
      },
    })

    useSettingsStore.getState().setMigrationError('migration failed')
    useTaskStore.getState().addTask({ title: 'Reset me', importance: 3, urgency: 3, tags: [] })
    useReminderStore.getState().schedule({
      id: 'reminder_reset',
      taskId: 'task_reset',
      minutesBefore: 15,
      fireAt: '2026-04-15T09:00:00.000Z',
      channel: 'in-app',
      enabled: true,
    })

    render(<SettingsView clockDriftMsOverride={180_000} />)

    expect(await screen.findByText(/privacy mode warning/i)).toBeInTheDocument()
    expect(screen.getByText(/clock drift detected/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /reset database/i }))

    await waitFor(() => {
      expect(useTaskStore.getState().tasks).toHaveLength(0)
      expect(useReminderStore.getState().reminders).toHaveLength(0)
    })
  })
})
