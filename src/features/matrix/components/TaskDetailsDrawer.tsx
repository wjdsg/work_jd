import type { TaskRecord } from '../../../models/task'

interface TaskDetailsDrawerProps {
  task: TaskRecord | null
  open: boolean
  onClose: () => void
  onUpdate: (taskId: string, patch: Pick<TaskRecord, 'importance' | 'urgency'>) => void
}

export function TaskDetailsDrawer({ task, open, onClose, onUpdate }: TaskDetailsDrawerProps) {
  if (!open || !task) return null

  return (
    <aside className="task-details-drawer" aria-label="任务详情" role="dialog" aria-modal="true">
      <header>
        <h3>{task.title}</h3>
        <button type="button" onClick={onClose}>
          关闭
        </button>
      </header>
      <p>任务历史与备注模块即将开放。</p>
      <dl>
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
      </dl>
    </aside>
  )
}
