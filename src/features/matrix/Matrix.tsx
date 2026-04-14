// Author: mjw
// Date: 2026-04-13

import { useState } from 'react'
import { Quadrant, Task, TaskStatus, TaskCreateInput, TaskUpdateInput } from '@/models/task'
import { useTaskStore } from './hooks/useTaskStore'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { QuadrantComponent } from './components/Quadrant'
import { TaskForm } from './components/TaskForm'
import './Matrix.css'

export function Matrix() {
  const {
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByQuadrant,
  } = useTaskStore()

  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formQuadrant, setFormQuadrant] = useState<Quadrant | undefined>(undefined)

  const { dragState, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } =
    useDragAndDrop(async (taskId: string, targetQuadrant: Quadrant) => {
      await moveTask(taskId, targetQuadrant)
    })

  const handleCreateClick = (quadrant?: Quadrant) => {
    setEditingTask(null)
    setFormQuadrant(quadrant)
    setShowForm(true)
  }

  const handleEditClick = (task: Task) => {
    setEditingTask(task)
    setFormQuadrant(undefined)
    setShowForm(true)
  }

  const handleFormSubmit = async (input: TaskCreateInput | TaskUpdateInput) => {
    if (editingTask) {
      await updateTask(editingTask.id, input)
    } else {
      await createTask(input as TaskCreateInput)
    }
    setShowForm(false)
    setEditingTask(null)
    setFormQuadrant(undefined)
  }

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status })
  }

  const handleDeleteClick = async (taskId: string) => {
    if (confirm('确定要删除此任务吗？')) {
      await deleteTask(taskId)
    }
  }

  if (loading) {
    return (
      <div className="matrix-loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="matrix-error">
        <p>加载失败: {error.message}</p>
        <button onClick={() => window.location.reload()}>重新加载</button>
      </div>
    )
  }

  const quadrants = [
    { quadrant: Quadrant.ImportantUrgent, position: 'top-left' },
    { quadrant: Quadrant.ImportantNotUrgent, position: 'top-right' },
    { quadrant: Quadrant.NotImportantUrgent, position: 'bottom-left' },
    { quadrant: Quadrant.NotImportantNotUrgent, position: 'bottom-right' },
  ]

  return (
    <div className="matrix">
      <div className="matrix-header">
        <h1 className="matrix-title">艾森豪威尔矩阵</h1>
        <button className="matrix-add-btn" onClick={() => handleCreateClick()}>
          + 新建任务
        </button>
      </div>

      <div className="matrix-axis-labels">
        <div className="axis-label importance-label">
          <span>重要</span>
          <div className="axis-line"></div>
        </div>
        <div className="axis-label urgency-label">
          <span>紧急</span>
          <div className="axis-line"></div>
        </div>
      </div>

      <div className="matrix-grid">
        {quadrants.map(({ quadrant }) => (
          <QuadrantComponent
            key={quadrant}
            quadrant={quadrant}
            tasks={getTasksByQuadrant(quadrant)}
            dragState={dragState}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onEditTask={handleEditClick}
            onDeleteTask={handleDeleteClick}
            onStatusChange={handleStatusChange}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {showForm && (
        <TaskForm
          task={editingTask ?? undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingTask(null)
            setFormQuadrant(undefined)
          }}
          defaultQuadrant={formQuadrant}
        />
      )}
    </div>
  )
}