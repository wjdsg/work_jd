import { FormEvent, useMemo, useState } from 'react'
import type { TaskDraft } from '../../../models/task'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSave: (draft: TaskDraft) => void
}

const initialDraft: TaskDraft = {
  title: '',
  importance: 6,
  urgency: 6,
  estimatedDays: 1,
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
    <div className="task-form-overlay" role="dialog" aria-modal="true" aria-label="新建任务">
      <form className="task-form" onSubmit={handleSubmit}>
        <h3>新建任务</h3>
        <label htmlFor="task-title">标题</label>
        <input
          id="task-title"
          name="title"
          value={draft.title}
          onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
        />

        <label htmlFor="task-importance">重要性</label>
        <input
          id="task-importance"
          name="importance"
          type="range"
          min={1}
          max={10}
          step={1}
          value={draft.importance}
          onChange={(event) => setDraft((prev) => ({ ...prev, importance: Number(event.target.value) }))}
        />

        <label htmlFor="task-urgency">紧急性</label>
        <input
          id="task-urgency"
          name="urgency"
          type="range"
          min={1}
          max={10}
          step={1}
          value={draft.urgency}
          onChange={(event) => setDraft((prev) => ({ ...prev, urgency: Number(event.target.value) }))}
        />

        <label htmlFor="task-estimatedDays">预计天数</label>
        <input
          id="task-estimatedDays"
          name="estimatedDays"
          type="number"
          min={1}
          max={30}
          step={1}
          value={draft.estimatedDays ?? 1}
          onChange={(event) => setDraft((prev) => ({ ...prev, estimatedDays: Number(event.target.value) }))}
        />

        <div className="task-form-actions">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="submit" disabled={!isValid}>
            保存任务
          </button>
        </div>
      </form>
    </div>
  )
}
