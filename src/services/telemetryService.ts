// Author: mjw
// Date: 2026-04-15

export interface TelemetryEvent {
  event: string
  payload?: Record<string, unknown>
  at: string
}

const telemetryBuffer: TelemetryEvent[] = []

export const telemetryService = {
  track(event: string, payload?: Record<string, unknown>) {
    const entry: TelemetryEvent = {
      event,
      payload,
      at: new Date().toISOString(),
    }
    telemetryBuffer.push(entry)
    console.info('[telemetry]', entry)
    return entry
  },
  getEvents() {
    return [...telemetryBuffer]
  },
  clear() {
    telemetryBuffer.length = 0
  },
}
