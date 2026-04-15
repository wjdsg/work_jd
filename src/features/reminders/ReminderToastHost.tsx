// Author: mjw
// Date: 2026-04-15

import { useEffect, useMemo, useState } from 'react'
import { createReminderService } from '../../services/reminderService'

export function ReminderToastHost() {
  const reminderService = useMemo(() => createReminderService(), [])
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribeChange = reminderService.onChange((reminders) => {
      const fired = reminders.find((item) => item.state === 'fired')
      if (fired) {
        setMessage(`Reminder fired for ${fired.taskId}`)
      }
    })

    const unsubscribeError = reminderService.onError(() => {
      setMessage('Notification fallback activated. Check reminders panel.')
    })

    return () => {
      unsubscribeChange()
      unsubscribeError()
    }
  }, [reminderService])

  if (!message) return null

  return (
    <div className="reminder-toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
