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

    expect(screen.getByText(/同步状态：降级模式/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^主题模式$/i), { target: { value: 'dark' } })
    fireEvent.change(screen.getByLabelText(/^时区$/i), { target: { value: 'Asia/Shanghai' } })
    fireEvent.change(screen.getByLabelText(/重要性阈值/i), { target: { value: '5' } })

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

    fireEvent.click(screen.getByRole('button', { name: /导出 json/i }))
    expect(await screen.findByText(/已导出 json/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /导出 csv/i }))
    expect(await screen.findByText(/已导出 csv/i)).toBeInTheDocument()

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

    fireEvent.change(screen.getByLabelText(/导入 json/i), { target: { value: payload } })
    fireEvent.click(screen.getByRole('button', { name: /导入备份/i }))

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

    expect(await screen.findByText(/隐私模式预警/i)).toBeInTheDocument()
    expect(screen.getByText(/检测到时钟漂移/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /重置数据库/i }))

    await waitFor(() => {
      expect(useTaskStore.getState().tasks).toHaveLength(0)
      expect(useReminderStore.getState().reminders).toHaveLength(0)
    })
  })
})
