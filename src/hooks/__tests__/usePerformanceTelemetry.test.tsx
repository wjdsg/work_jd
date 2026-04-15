// Author: mjw
// Date: 2026-04-15

import { beforeEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePerformanceTelemetry } from '../usePerformanceTelemetry'
import { telemetryService } from '../../services/telemetryService'

describe('usePerformanceTelemetry', () => {
  beforeEach(() => {
    telemetryService.clear()
  })

  it('returns mark function that records event names', () => {
    const { result } = renderHook(() => usePerformanceTelemetry())

    result.current.mark('task.create')
    result.current.mark('task.drag')

    const marks = result.current.getMarks()
    expect(marks).toContain('task.create')
    expect(marks).toContain('task.drag')

    const tracked = telemetryService.getEvents().map((item) => item.event)
    expect(tracked).toContain('task.create')
    expect(tracked).toContain('task.drag')
  })
})
