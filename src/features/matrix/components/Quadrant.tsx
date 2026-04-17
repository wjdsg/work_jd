import type { DragEvent } from 'react'
import type { QuadrantId, TaskRecord } from '../../../models/task'
import { TaskCard } from './TaskCard'

interface QuadrantProps {
  quadrantId: QuadrantId
  title: string
  tasks: TaskRecord[]
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDrop: (event: DragEvent<HTMLElement>, quadrantId: QuadrantId) => void
  onTaskDragStart: (taskId: string, event: DragEvent<HTMLElement>) => void
  onTaskKeyMove: (taskId: string, key: string) => void
  onOpenDetails: (taskId: string) => void
  onCompleteTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

export function Quadrant({
  quadrantId,
  title,
  tasks,
  onDragOver,
  onDrop,
  onTaskDragStart,
  onTaskKeyMove,
  onOpenDetails,
  onCompleteTask,
  onDeleteTask,
}: QuadrantProps) {
  return (
    <section
      className="quadrant"
      data-testid={`quadrant-${quadrantId}`}
      onDragOver={(event) => onDragOver(event)}
      onDrop={(event) => onDrop(event, quadrantId)}
      aria-label={title}
    >
      <header className="quadrant-header">
        <h3>{title}</h3>
        <span>{tasks.length}</span>
      </header>
      {tasks.length === 0 ? (
        <p className="quadrant-empty">暂无任务</p>
      ) : (
        <div className="quadrant-list">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={onTaskDragStart}
              onKeyMove={onTaskKeyMove}
              onOpenDetails={onOpenDetails}
              onComplete={onCompleteTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}
    </section>
  )
}
