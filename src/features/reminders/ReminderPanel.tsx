// Author: mjw
// Date: 2026-04-15

import { format } from 'date-fns'
import { useReminderPanel } from './hooks/useReminderPanel'

interface ReminderListProps {
  title: string
  reminders: Array<{
    id: string
    taskId: string
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
        <p className="reminder-empty">No reminders</p>
      ) : (
        <ul className="reminder-list">
          {reminders.map((reminder) => (
            <li key={reminder.id} className="reminder-item">
              <div>
                <strong>{reminder.taskId}</strong>
                <p>{format(new Date(reminder.fireAt), 'PPp')}</p>
              </div>
              <div className="reminder-actions">
                {onSnooze ? (
                  <button type="button" onClick={() => onSnooze(reminder.id)} aria-label={`Snooze ${reminder.id}`}>
                    Snooze
                  </button>
                ) : null}
                {onDismiss ? (
                  <button type="button" onClick={() => onDismiss(reminder.id)} aria-label={`Dismiss ${reminder.id}`}>
                    Dismiss
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

  return (
    <div className="reminder-panel">
      <header className="reminder-panel-header">
        <h2>Reminders</h2>
      </header>
      {sleepWarning ? <p className="sleep-warning">{sleepWarning}</p> : null}
      <div className="reminder-grid">
        <ReminderList title="Today" reminders={todayReminders} onSnooze={snoozeReminder} onDismiss={dismissReminder} />
        <ReminderList title="Upcoming" reminders={upcomingReminders} onSnooze={snoozeReminder} onDismiss={dismissReminder} />
        <ReminderList title="Completed" reminders={completedReminders} />
      </div>
    </div>
  )
}
