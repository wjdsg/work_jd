// Author: mjw
// Date: 2026-04-15

import { useCallback, useMemo, useRef } from 'react'
import { telemetryService } from '../services/telemetryService'

const MAX_MARKS = 50

export function usePerformanceTelemetry() {
  const marksRef = useRef<string[]>([])

  const mark = useCallback((eventName: string, detail?: Record<string, unknown>) => {
    marksRef.current.push(eventName)
    if (marksRef.current.length > MAX_MARKS) {
      marksRef.current.shift()
    }

    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark(eventName)
    }

    telemetryService.track(eventName, detail)
  }, [])

  const getMarks = useCallback(() => {
    return [...marksRef.current]
  }, [])

  return useMemo(
    () => ({
      mark,
      getMarks,
    }),
    [getMarks, mark],
  )
}
