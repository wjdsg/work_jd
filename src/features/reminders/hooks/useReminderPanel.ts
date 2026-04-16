// Author: mjw
// Date: 2026-04-15

import { useEffect, useMemo, useState } from 'react'
import { createReminderService } from '../../../services/reminderService'
import { useReminderStore } from '../../../store/reminderStore'
import { visibilityWatcher } from '../../../infrastructure/visibilityWatcher'

const SLEEP_WARNING_THRESHOLD_MS = 120_000

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function useReminderPanel() {
  const reminders = useReminderStore((state) => state.reminders)
  const reminderService = useMemo(() => createReminderService(), [])
  const [sleepWarning, setSleepWarning] = useState<string | null>(null)

  const todayReminders = useMemo(() => {
    const now = new Date()
    return reminders.filter((reminder) => {
      const fireAt = new Date(reminder.fireAt)
      return reminder.state !== 'dismissed' && isSameDay(fireAt, now)
    })
  }, [reminders])

  const upcomingReminders = useMemo(() => {
    const now = new Date()
    return reminders.filter((reminder) => {
      const fireAt = new Date(reminder.fireAt)
      return reminder.state !== 'dismissed' && fireAt > now && !isSameDay(fireAt, now)
    })
  }, [reminders])

  const completedReminders = useMemo(
    () => reminders.filter((reminder) => reminder.state === 'dismissed' || reminder.state === 'fired'),
    [reminders],
  )

  useEffect(() => {
    let hiddenAt: number | null = null

    const unsubscribe = visibilityWatcher.subscribe((state) => {
      if (state === 'hidden') {
        hiddenAt = Date.now()
        return
      }

      if (state === 'visible') {
        if (hiddenAt && Date.now() - hiddenAt > SLEEP_WARNING_THRESHOLD_MS) {
          setSleepWarning('检测到浏览器休眠，提醒可能出现延迟。')
        }
        hiddenAt = null
        void reminderService.processDue()
      }
    })

    return () => unsubscribe()
  }, [reminderService])

  return {
    todayReminders,
    upcomingReminders,
    completedReminders,
    sleepWarning,
    snoozeReminder: (id: string) => reminderService.snooze(id),
    dismissReminder: (id: string) => reminderService.dismiss(id),
  }
}
