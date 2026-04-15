// Author: mjw
// Date: 2026-04-15

import { useEffect } from 'react'
import { usePerformanceTelemetry } from './usePerformanceTelemetry'

export function useAppTelemetry() {
  const { mark } = usePerformanceTelemetry()

  useEffect(() => {
    mark('app.start', { source: 'root' })
  }, [mark])
}
