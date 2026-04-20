// Author: mjw
// Date: 2026-04-15

import { useEffect, useMemo, useState } from 'react'
import { createReminderService } from '../../services/reminderService'
import { useTaskStore } from '../../store/taskStore'

export function ReminderToastHost() {
  const reminderService = useMemo(() => createReminderService(), [])
  const [message, setMessage] = useState<string | null>(null)
  const tasks = useTaskStore((state) => state.tasks)

  useEffect(() => {
    const unsubscribeChange = reminderService.onChange((reminders) => {
      const fired = reminders.find((item) => item.state === 'fired')
      if (fired) {
        const title = tasks.find((task) => task.id === fired.taskId)?.title ?? fired.taskId
        setMessage(`任务 ${title} 已触发提醒`)
      }
    })

    const unsubscribeError = reminderService.onError(() => {
      setMessage('系统通知不可用，已切换到应用内提醒。')
    })

    return () => {
      unsubscribeChange()
      unsubscribeError()
    }
  }, [reminderService, tasks])

  if (!message) return null

  return (
    <div className="reminder-toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
