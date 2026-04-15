import { FormEvent, useMemo, useState } from 'react'
import type { TaskDraft } from '../../../models/task'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSave: (draft: TaskDraft) => void
}

const initialDraft: TaskDraft = {
  title: '',
  importance: 3,
  urgency: 3,
  tags: [],
}

export function TaskForm({ open, onClose, onSave }: TaskFormProps) {
  const [draft, setDraft] = useState<TaskDraft>(initialDraft)

  const isValid = useMemo(() => draft.title.trim().length > 0, [draft.title])

  if (!open) return null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValid) return
    onSave({ ...draft, title: draft.title.trim() })
    setDraft(initialDraft)
    onClose()
  }

  return (
    <div className="task-form-overlay" role="dialog" aria-modal="true" aria-label="Create task">
      <form className="task-form" onSubmit={handleSubmit}>
        <h3>Add Task</h3>
        <label htmlFor="task-title">Title</label>
        <input
          id="task-title"
          name="title"
          value={draft.title}
          onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
        />

        <label htmlFor="task-importance">Importance</label>
        <input
          id="task-importance"
          name="importance"
          type="range"
          min={1}
          max={5}
          value={draft.importance}
          onChange={(event) => setDraft((prev) => ({ ...prev, importance: Number(event.target.value) }))}
        />

        <label htmlFor="task-urgency">Urgency</label>
        <input
          id="task-urgency"
          name="urgency"
          type="range"
          min={1}
          max={5}
          value={draft.urgency}
          onChange={(event) => setDraft((prev) => ({ ...prev, urgency: Number(event.target.value) }))}
        />

        <div className="task-form-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={!isValid}>
            Save Task
          </button>
        </div>
      </form>
    </div>
  )
}
