// Author: mjw
// Date: 2026-04-13

import React from 'react'
import { Task, Quadrant, TaskStatus, getQuadrantLabel, getQuadrantColor } from '@/models/task'
import { TaskCard } from './TaskCard'
import type { DragState } from '../hooks/useDragAndDrop'
import './Quadrant.css'

interface QuadrantComponentProps {
  quadrant: Quadrant
  tasks: Task[]
  dragState: DragState
  onDragOver: (e: React.DragEvent, quadrant: Quadrant) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, quadrant: Quadrant) => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: TaskStatus) => void
  onDragStart?: (taskId: string, quadrant: Quadrant) => void
  onDragEnd?: () => void
}

export function QuadrantComponent({
  quadrant,
  tasks,
  dragState,
  onDragOver,
  onDragLeave,
  onDrop,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onDragStart,
  onDragEnd,
}: QuadrantComponentProps) {
  const label = getQuadrantLabel(quadrant)
  const color = getQuadrantColor(quadrant)
  const isDragOver = dragState.dragOverQuadrant === quadrant

  const handleDragOver = (e: React.DragEvent) => {
    onDragOver(e, quadrant)
  }

  const handleDrop = (e: React.DragEvent) => {
    onDrop(e, quadrant)
  }

  const filteredTasks = tasks.filter((t) => t.status !== TaskStatus.Archived)

  return (
    <div
      className={`quadrant ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
    >
      <div className="quadrant-header" style={{ borderBottomColor: color }}>
        <h3 className="quadrant-title" style={{ color }}>
          {label}
        </h3>
        <span className="quadrant-count">{filteredTasks.length}</span>
      </div>
      <div className="quadrant-content">
        {filteredTasks.length === 0 ? (
          <div className="quadrant-empty">
            <p>拖拽任务到此处</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  )
}