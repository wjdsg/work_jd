// Author: mjw
// Date: 2026-04-16

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TaskRecord } from '../../models/task'
import { appendCompletedLog, readDailyLogs } from '../dailyLogService'

describe('dailyLogService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('appends completed log with required fields and semantics', () => {
    vi.setSystemTime(new Date('2026-04-16T09:08:07.000Z'))

    appendCompletedLog({ id: 'task_1', title: '完成日报' } as TaskRecord)

    const logs = readDailyLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0]).toEqual(
      expect.objectContaining({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        taskId: 'task_1',
        title: '完成日报',
        event: 'task_completed',
        at: expect.stringMatching(/Z$/),
      }),
    )
  })

  it('returns empty list when localStorage payload is corrupted', () => {
    localStorage.setItem('daily-work-log', '{invalid-json')

    const logs = readDailyLogs()

    expect(logs).toEqual([])
  })
})
