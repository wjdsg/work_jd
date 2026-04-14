// Author: mjw
// Date: 2026-04-13

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskCard } from '@/features/matrix/components/TaskCard'
import { Task, TaskStatus, Quadrant, TaskPriority } from '@/models/task'

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test Description',
  importance: TaskPriority.High,
  urgency: TaskPriority.High,
  quadrant: Quadrant.ImportantUrgent,
  status: TaskStatus.Todo,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ['work', 'important'],
}

describe('TaskCard', () => {
  it('should render task title and description', () => {
    render(<TaskCard task={mockTask} />)

    expect(screen.getByText('Test Task')).toBeDefined()
    expect(screen.getByText('Test Description')).toBeDefined()
  })

  it('should render task status', () => {
    render(<TaskCard task={mockTask} />)

    expect(screen.getByText('待办')).toBeDefined()
  })

  it('should render task tags', () => {
    render(<TaskCard task={mockTask} />)

    expect(screen.getByText('work')).toBeDefined()
    expect(screen.getByText('important')).toBeDefined()
  })

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<TaskCard task={mockTask} onEdit={onEdit} />)

    const editButton = screen.getByTitle('编辑')
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockTask)
  })

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<TaskCard task={mockTask} onDelete={onDelete} />)

    const deleteButton = screen.getByTitle('删除')
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith('task-1')
  })

  it('should call onStatusChange when complete button is clicked', () => {
    const onStatusChange = vi.fn()
    render(<TaskCard task={mockTask} onStatusChange={onStatusChange} />)

    const completeButton = screen.getByTitle('标记完成')
    fireEvent.click(completeButton)

    expect(onStatusChange).toHaveBeenCalledWith('task-1', TaskStatus.Completed)
  })

  it('should not show complete button for completed tasks', () => {
    const completedTask = { ...mockTask, status: TaskStatus.Completed }
    render(<TaskCard task={completedTask} />)

    expect(screen.queryByTitle('标记完成')).toBeNull()
  })

  it('should set draggable attribute', () => {
    render(<TaskCard task={mockTask} />)

    const card = screen.getByText('Test Task').closest('.task-card')
    expect(card?.getAttribute('draggable')).toBe('true')
  })
})