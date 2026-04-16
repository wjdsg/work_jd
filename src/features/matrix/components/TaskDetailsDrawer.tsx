import type { TaskRecord } from '../../../models/task'

interface TaskDetailsDrawerProps {
  task: TaskRecord | null
  open: boolean
  onClose: () => void
}

export function TaskDetailsDrawer({ task, open, onClose }: TaskDetailsDrawerProps) {
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
        <dd>{task.importance}</dd>
        <dt>紧急性</dt>
        <dd>{task.urgency}</dd>
      </dl>
    </aside>
  )
}
