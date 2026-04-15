import type { DragEvent, KeyboardEvent } from 'react'
import type { TaskRecord } from '../../../models/task'

interface TaskCardProps {
  task: TaskRecord
  onDragStart: (taskId: string, event: DragEvent<HTMLElement>) => void
  onKeyMove: (taskId: string, key: string) => void
  onOpenDetails: (taskId: string) => void
}

export function TaskCard({ task, onDragStart, onKeyMove, onOpenDetails }: TaskCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (!navigationKeys.includes(event.key)) return
    event.preventDefault()
    onKeyMove(task.id, event.key)
  }

  return (
    <article className="task-card" draggable onDragStart={(event) => onDragStart(task.id, event)}>
      <button
        type="button"
        className="task-card-main"
        onKeyDown={handleKeyDown}
        onClick={() => onOpenDetails(task.id)}
        aria-label={`Open task ${task.title}`}
      >
        <h4>{task.title}</h4>
        <p>
          Importance {task.importance} · Urgency {task.urgency}
        </p>
      </button>
    </article>
  )
}
