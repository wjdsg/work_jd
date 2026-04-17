import type { TaskPatch, TaskRecord } from '../../../models/task'

interface TaskDetailsDrawerProps {
  task: TaskRecord | null
  open: boolean
  onClose: () => void
  onUpdate: (taskId: string, patch: TaskPatch) => void
  onDelete: (taskId: string) => void
}

function toDateTimeLocalValue(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return adjusted.toISOString().slice(0, 16)
}

export function TaskDetailsDrawer({ task, open, onClose, onUpdate, onDelete }: TaskDetailsDrawerProps) {
  if (!open || !task) return null

  return (
    <aside className="task-details-drawer" aria-label="任务详情" role="dialog" aria-modal="true">
      <header>
        <h3>{task.title}</h3>
        <div className="task-details-actions">
          <button
            type="button"
            className="task-delete-danger"
            onClick={() => onDelete(task.id)}
          >
            删除任务
          </button>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </div>
      </header>
      <p>任务历史与备注模块即将开放。</p>
      <dl>
        <dt>任务名</dt>
        <dd>
          <input
            id="drawer-title"
            aria-label="任务名"
            type="text"
            value={task.title}
            onChange={(event) => onUpdate(task.id, { title: event.target.value })}
          />
        </dd>
        <dt>重要性</dt>
        <dd>
          <input
            id="drawer-importance"
            aria-label="重要性"
            type="range"
            min={1}
            max={10}
            step={1}
            value={task.importance}
            onChange={(event) => onUpdate(task.id, { importance: Number(event.target.value), urgency: task.urgency })}
          />
          <span>{task.importance}</span>
        </dd>
        <dt>紧急性</dt>
        <dd>
          <input
            id="drawer-urgency"
            aria-label="紧急性"
            type="range"
            min={1}
            max={10}
            step={1}
            value={task.urgency}
            onChange={(event) => onUpdate(task.id, { importance: task.importance, urgency: Number(event.target.value) })}
          />
          <span>{task.urgency}</span>
        </dd>
        <dt>完成时间</dt>
        <dd>
          <input
            id="drawer-completed-at"
            aria-label="完成时间"
            type="datetime-local"
            value={toDateTimeLocalValue(task.stats.completedAt)}
            onChange={(event) => {
              const next = event.target.value
              onUpdate(task.id, { completedAt: next ? new Date(next).toISOString() : '' })
            }}
          />
        </dd>
      </dl>
    </aside>
  )
}
