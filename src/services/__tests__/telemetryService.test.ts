// Author: mjw
// Date: 2026-04-15

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { telemetryService } from '../telemetryService'

describe('telemetryService', () => {
  beforeEach(() => {
    telemetryService.clear()
    vi.restoreAllMocks()
  })

  it('records event with timestamp and payload', () => {
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    telemetryService.track('task.create', { source: 'matrix' })

    const events = telemetryService.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('task.create')
    expect(events[0].payload).toEqual({ source: 'matrix' })
    expect(logSpy).toHaveBeenCalled()
  })
})
