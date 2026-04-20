// Author: mjw
// Date: 2026-04-17

import { useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useReminderStore } from '../store/reminderStore'
import { createReminderService } from '../services/reminderService'

const DEFAULT_MINUTES_BEFORE = 30

function toReminderId(taskId: string) {
  return `task_due_${taskId}`
}

export function useTaskReminderSync() {
  useEffect(() => {
    const reminderService = createReminderService()

    const sync = () => {
      const tasks = useTaskStore.getState().tasks
      const reminderStore = useReminderStore.getState()

      tasks.forEach((task) => {
        const reminderId = toReminderId(task.id)
        const exists = reminderStore.reminders.some((item) => item.id === reminderId)
        const shouldHaveReminder = Boolean(task.dueDate) && task.status !== 'completed'

        if (shouldHaveReminder && task.dueDate) {
          reminderService.schedule({
            id: reminderId,
            taskId: task.id,
            minutesBefore: DEFAULT_MINUTES_BEFORE,
            fireAt: task.dueDate,
            channel: 'in-app',
            enabled: true,
          })
        }

        if (!shouldHaveReminder && exists) {
          reminderStore.remove(reminderId)
        }
      })

      const validTaskIds = new Set(tasks.map((task) => task.id))
      reminderStore.reminders.forEach((reminder) => {
        if (!reminder.id.startsWith('task_due_')) return
        if (validTaskIds.has(reminder.taskId)) return
        reminderStore.remove(reminder.id)
      })
    }

    sync()
    const unsubscribeTasks = useTaskStore.subscribe(() => {
      sync()
    })

    return () => {
      unsubscribeTasks()
    }
  }, [])
}
