import type { TaskRecord } from '../../../models/task'

interface TaskDetailsDrawerProps {
  task: TaskRecord | null
  open: boolean
  onClose: () => void
}

export function TaskDetailsDrawer({ task, open, onClose }: TaskDetailsDrawerProps) {
  if (!open || !task) return null

  return (
    <aside className="task-details-drawer" aria-label="Task details" role="dialog" aria-modal="true">
      <header>
        <h3>{task.title}</h3>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </header>
      <p>History and notes are coming soon.</p>
      <dl>
        <dt>Importance</dt>
        <dd>{task.importance}</dd>
        <dt>Urgency</dt>
        <dd>{task.urgency}</dd>
      </dl>
    </aside>
  )
}
