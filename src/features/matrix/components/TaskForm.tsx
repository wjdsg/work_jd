// Author: mjw
// Date: 2026-04-13

import React, { useState, useEffect } from 'react'
import { Task, TaskCreateInput, TaskUpdateInput, TaskPriority, Quadrant } from '@/models/task'
import './TaskForm.css'

interface TaskFormProps {
  task?: Task
  onSubmit: (input: TaskCreateInput | TaskUpdateInput) => void
  onCancel: () => void
  defaultQuadrant?: Quadrant
}

export function TaskForm({ task, onSubmit, onCancel, defaultQuadrant }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [importance, setImportance] = useState<TaskPriority>(task?.importance ?? TaskPriority.Medium)
  const [urgency, setUrgency] = useState<TaskPriority>(task?.urgency ?? TaskPriority.Medium)
  const [deadline, setDeadline] = useState<string>(
    task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
  )
  const [reminder, setReminder] = useState<string>(
    task?.reminder ? new Date(task.reminder).toISOString().slice(0, 16) : ''
  )
  const [tags, setTags] = useState<string>(task?.tags?.join(', ') ?? '')

  useEffect(() => {
    if (defaultQuadrant && !task) {
      const mapping: Record<Quadrant, { importance: TaskPriority; urgency: TaskPriority }> = {
        [Quadrant.ImportantUrgent]: { importance: TaskPriority.High, urgency: TaskPriority.High },
        [Quadrant.ImportantNotUrgent]: { importance: TaskPriority.High, urgency: TaskPriority.Low },
        [Quadrant.NotImportantUrgent]: { importance: TaskPriority.Low, urgency: TaskPriority.High },
        [Quadrant.NotImportantNotUrgent]: { importance: TaskPriority.Low, urgency: TaskPriority.Low },
      }
      const config = mapping[defaultQuadrant]
      setImportance(config.importance)
      setUrgency(config.urgency)
    }
  }, [defaultQuadrant, task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('请输入任务标题')
      return
    }

    const input: TaskCreateInput | TaskUpdateInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      importance,
      urgency,
      deadline: deadline ? new Date(deadline) : undefined,
      reminder: reminder ? new Date(reminder) : undefined,
      tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    }

    onSubmit(input)
  }

  const priorityOptions = [
    { value: TaskPriority.Low, label: '低' },
    { value: TaskPriority.Medium, label: '中' },
    { value: TaskPriority.High, label: '高' },
  ]

  return (
    <div className="task-form-overlay">
      <form className="task-form" onSubmit={handleSubmit}>
        <h3 className="task-form-title">{task ? '编辑任务' : '创建任务'}</h3>

        <div className="task-form-field">
          <label htmlFor="title">标题 *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入任务标题"
            autoFocus
          />
        </div>

        <div className="task-form-field">
          <label htmlFor="description">描述</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入任务描述（可选）"
            rows={3}
          />
        </div>

        <div className="task-form-row">
          <div className="task-form-field">
            <label htmlFor="importance">重要性</label>
            <select
              id="importance"
              value={importance}
              onChange={(e) => setImportance(Number(e.target.value) as TaskPriority)}
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="task-form-field">
            <label htmlFor="urgency">紧急性</label>
            <select
              id="urgency"
              value={urgency}
              onChange={(e) => setUrgency(Number(e.target.value) as TaskPriority)}
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="task-form-row">
          <div className="task-form-field">
            <label htmlFor="deadline">截止日期</label>
            <input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="task-form-field">
            <label htmlFor="reminder">提醒时间</label>
            <input
              id="reminder"
              type="datetime-local"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
            />
          </div>
        </div>

        <div className="task-form-field">
          <label htmlFor="tags">标签</label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="用逗号分隔多个标签"
          />
        </div>

        <div className="task-form-actions">
          <button type="button" className="task-form-btn cancel" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="task-form-btn submit">
            {task ? '更新' : '创建'}
          </button>
        </div>
      </form>
    </div>
  )
}