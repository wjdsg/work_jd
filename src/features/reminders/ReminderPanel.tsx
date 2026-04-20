// Author: mjw
// Date: 2026-04-15

import { format } from 'date-fns'
import { useReminderPanel } from './hooks/useReminderPanel'
import { useTaskStore } from '../../store/taskStore'

interface ReminderListProps {
  title: string
  reminders: Array<{
    id: string
    taskId: string
    taskLabel: string
    fireAt: string
    state: string
  }>
  onSnooze?: (id: string) => void
  onDismiss?: (id: string) => void
}

function ReminderList({ title, reminders, onSnooze, onDismiss }: ReminderListProps) {
  return (
    <section className="reminder-list-section" aria-label={title}>
      <header>
        <h3>{title}</h3>
        <span>{reminders.length}</span>
      </header>
      {reminders.length === 0 ? (
        <p className="reminder-empty">暂无提醒</p>
      ) : (
        <ul className="reminder-list">
          {reminders.map((reminder) => (
            <li key={reminder.id} className="reminder-item">
              <div>
                <strong>{reminder.taskId}</strong>
                <p>{reminder.taskLabel}</p>
                <p>{format(new Date(reminder.fireAt), 'PPp')}</p>
              </div>
              <div className="reminder-actions">
                {onSnooze ? (
                  <button type="button" onClick={() => onSnooze(reminder.id)} aria-label={`稍后提醒 ${reminder.id}`}>
                    稍后提醒
                  </button>
                ) : null}
                {onDismiss ? (
                  <button type="button" onClick={() => onDismiss(reminder.id)} aria-label={`忽略提醒 ${reminder.id}`}>
                    忽略
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function ReminderPanel() {
  const { todayReminders, upcomingReminders, completedReminders, sleepWarning, snoozeReminder, dismissReminder } =
    useReminderPanel()
  const tasks = useTaskStore((state) => state.tasks)

  const taskLabelMap = new Map(tasks.map((task) => [task.id, task.title]))

  const mapReminders = (
    reminders: Array<{
      id: string
      taskId: string
      fireAt: string
      state: string
    }>
  ) => reminders.map((item) => ({ ...item, taskLabel: taskLabelMap.get(item.taskId) ?? '未找到任务' }))

  return (
    <div className="reminder-panel">
      <header className="reminder-panel-header">
        <h2>提醒中心</h2>
      </header>
      {sleepWarning ? <p className="sleep-warning">{sleepWarning}</p> : null}
      <div className="reminder-grid">
        <ReminderList
          title="今日提醒"
          reminders={mapReminders(todayReminders)}
          onSnooze={snoozeReminder}
          onDismiss={dismissReminder}
        />
        <ReminderList
          title="即将到来"
          reminders={mapReminders(upcomingReminders)}
          onSnooze={snoozeReminder}
          onDismiss={dismissReminder}
        />
        <ReminderList title="已处理" reminders={mapReminders(completedReminders)} />
      </div>
    </div>
  )
}
