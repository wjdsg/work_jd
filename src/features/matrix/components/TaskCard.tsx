// Author: mjw
// Date: 2026-04-13

import React from 'react'
import { Task, TaskStatus, Quadrant } from '@/models/task'
import './TaskCard.css'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: TaskStatus) => void
  onDragStart?: (taskId: string, quadrant: Quadrant) => void
  onDragEnd?: () => void
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
    onDragStart?.(task.id, task.quadrant)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== TaskStatus.Completed

  const statusLabels: Record<TaskStatus, string> = {
    [TaskStatus.Todo]: '待办',
    [TaskStatus.InProgress]: '进行中',
    [TaskStatus.Completed]: '已完成',
    [TaskStatus.Archived]: '已归档',
  }

  return (
    <div
      className={`task-card ${isOverdue ? 'overdue' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="task-card-header">
        <h4 className="task-card-title">{task.title}</h4>
        <span className={`task-card-status task-card-status-${task.status}`}>
          {statusLabels[task.status]}
        </span>
      </div>

      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}

      <div className="task-card-meta">
        {task.deadline && (
          <span className={`task-card-deadline ${isOverdue ? 'overdue' : ''}`}>
            截止: {formatDate(task.deadline)}
          </span>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="task-card-tags">
            {task.tags.map((tag: string) => (
              <span key={tag} className="task-card-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="task-card-actions">
        {onStatusChange && task.status !== TaskStatus.Completed && (
          <button
            className="task-card-action complete"
            onClick={() => onStatusChange(task.id, TaskStatus.Completed)}
            title="标记完成"
          >
            ✓
          </button>
        )}
        {onEdit && (
          <button
            className="task-card-action edit"
            onClick={() => onEdit(task)}
            title="编辑"
          >
            ✎
          </button>
        )}
        {onDelete && (
          <button
            className="task-card-action delete"
            onClick={() => onDelete(task.id)}
            title="删除"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}