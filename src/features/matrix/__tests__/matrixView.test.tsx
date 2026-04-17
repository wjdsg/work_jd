// Author: mjw
// Date: 2026-04-15

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import MatrixView from '../MatrixView'
import { useTaskStore } from '../../../store/taskStore'
import * as dailyLogService from '../../../services/dailyLogService'

describe('MatrixView', () => {
  beforeEach(() => {
    useTaskStore.getState().clear()
  })

  it('renders matrix overview with four quadrants', () => {
    render(<MatrixView />)

    expect(screen.getByRole('heading', { name: /重要性 x 紧急性矩阵/i })).toBeInTheDocument()
    expect(screen.getByTestId('quadrant-q1')).toBeInTheDocument()
    expect(screen.getByTestId('quadrant-q2')).toBeInTheDocument()
    expect(screen.getByTestId('quadrant-q3')).toBeInTheDocument()
    expect(screen.getByTestId('quadrant-q4')).toBeInTheDocument()
    expect(screen.getAllByText(/暂无任务/i)).toHaveLength(4)
  })

  it('renders top-left as important-not-urgent and top-right as important-urgent', () => {
    render(<MatrixView />)

    expect(within(screen.getByTestId('quadrant-q2')).getByRole('heading', { level: 3 })).toHaveTextContent('重要不紧急')
    expect(within(screen.getByTestId('quadrant-q1')).getByRole('heading', { level: 3 })).toHaveTextContent('重要且紧急')
  })

  it('creates a task from the form and shows it in expected quadrant', async () => {
    render(<MatrixView />)

    fireEvent.click(screen.getByRole('button', { name: /新建任务/i }))
    fireEvent.change(screen.getByLabelText(/标题/i), { target: { value: '准备冲刺演示' } })
    fireEvent.change(screen.getByLabelText(/^重要性$/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/^紧急性$/i), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /保存任务/i }))

    expect(await screen.findByText('准备冲刺演示')).toBeInTheDocument()
    expect(within(screen.getByTestId('quadrant-q1')).getByText('准备冲刺演示')).toBeInTheDocument()
  })

  it('uses 1-10 range for importance and urgency sliders', () => {
    render(<MatrixView />)

    fireEvent.click(screen.getByRole('button', { name: /新建任务/i }))

    expect(screen.getByLabelText(/^重要性$/i)).toHaveAttribute('min', '1')
    expect(screen.getByLabelText(/^重要性$/i)).toHaveAttribute('max', '10')
    expect(screen.getByLabelText(/^紧急性$/i)).toHaveAttribute('min', '1')
    expect(screen.getByLabelText(/^紧急性$/i)).toHaveAttribute('max', '10')
  })

  it('moves task with keyboard interaction between quadrants', async () => {
    useTaskStore.getState().addTask({
      title: '键盘移动任务',
      importance: 10,
      urgency: 10,
      tags: [],
    })

    render(<MatrixView />)

    const taskCard = await screen.findByRole('button', { name: /打开任务 键盘移动任务/i })
    fireEvent.keyDown(taskCard, { key: 'ArrowDown' })

    expect(await within(screen.getByTestId('quadrant-q3')).findByText('键盘移动任务')).toBeInTheDocument()
  })

  it('completes task by check button and does not open drawer', async () => {
    useTaskStore.getState().addTask({
      title: '完成任务样例',
      importance: 10,
      urgency: 10,
      tags: [],
    })

    render(<MatrixView />)

    fireEvent.click(await screen.findByRole('button', { name: /完成任务 完成任务样例/i }))

    const record = useTaskStore.getState().tasks.find((task) => task.title === '完成任务样例')
    expect(record?.status).toBe('completed')
    expect(screen.queryByRole('dialog', { name: /任务详情/i })).not.toBeInTheDocument()
  })

  it('keeps completion flow when log write fails', async () => {
    const appendSpy = vi.spyOn(dailyLogService, 'appendCompletedLog').mockImplementation(() => {
      throw new Error('log write failed')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    useTaskStore.getState().addTask({
      title: '日志失败任务',
      importance: 10,
      urgency: 10,
      tags: [],
    })

    render(<MatrixView />)

    fireEvent.click(await screen.findByRole('button', { name: /完成任务 日志失败任务/i }))

    const record = useTaskStore.getState().tasks.find((task) => task.title === '日志失败任务')
    expect(record?.status).toBe('completed')
    expect(warnSpy).toHaveBeenCalled()

    appendSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('writes completed log with required fields', async () => {
    const appendSpy = vi.spyOn(dailyLogService, 'appendCompletedLog')

    useTaskStore.getState().addTask({
      title: '日志字段任务',
      importance: 10,
      urgency: 10,
      tags: [],
    })

    render(<MatrixView />)

    fireEvent.click(await screen.findByRole('button', { name: /完成任务 日志字段任务/i }))

    expect(appendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        title: '日志字段任务',
      }),
    )

    const payload = localStorage.getItem('daily-work-log')
    expect(payload).not.toBeNull()
    const parsed = JSON.parse(payload ?? '[]')
    expect(parsed[parsed.length - 1]).toEqual(
      expect.objectContaining({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        taskId: expect.any(String),
        title: '日志字段任务',
        event: 'task_completed',
        at: expect.stringMatching(/Z$/),
      }),
    )

    appendSpy.mockRestore()
  })

  it('does not render complete button for completed task', async () => {
    useTaskStore.getState().addTask({
      title: '已完成任务',
      importance: 10,
      urgency: 10,
      tags: [],
    })
    const added = useTaskStore.getState().tasks.find((task) => task.title === '已完成任务')
    if (added) {
      useTaskStore.getState().updateTask(added.id, { status: 'completed' })
    }

    render(<MatrixView />)

    expect(screen.queryByRole('button', { name: /完成任务 已完成任务/i })).not.toBeInTheDocument()
  })

  it('deletes task from matrix panel', async () => {
    useTaskStore.getState().addTask({
      title: '删除样例任务',
      importance: 9,
      urgency: 8,
      tags: [],
    })

    render(<MatrixView />)

    expect(await screen.findByText('删除样例任务')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /删除任务 删除样例任务/i }))

    expect(screen.queryByText('删除样例任务')).not.toBeInTheDocument()
    const found = useTaskStore.getState().tasks.find((task) => task.title === '删除样例任务')
    expect(found).toBeUndefined()
  })

  it('re-edits importance and urgency in drawer and recomputes quadrant', async () => {
    useTaskStore.getState().addTask({
      title: 'edit-me',
      importance: 10,
      urgency: 10,
      tags: [],
    })

    render(<MatrixView />)
    const openButton = await screen.findByRole('button', { name: /打开任务 edit-me/i })
    fireEvent.click(openButton)

    fireEvent.change(screen.getByLabelText(/^重要性$/i), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/^紧急性$/i), { target: { value: '10' } })

    expect(await within(screen.getByTestId('quadrant-q3')).findByText('edit-me')).toBeInTheDocument()
  })

  it('re-edits task title and completion time in drawer', async () => {
    useTaskStore.getState().addTask({
      title: '原始任务名',
      importance: 7,
      urgency: 7,
      tags: [],
    })

    render(<MatrixView />)
    fireEvent.click(await screen.findByRole('button', { name: /打开任务 原始任务名/i }))

    fireEvent.change(screen.getByLabelText(/^任务名$/i), { target: { value: '修改后的任务名' } })
    fireEvent.change(screen.getByLabelText(/^完成时间$/i), { target: { value: '2026-04-20T10:30' } })

    expect(await screen.findByRole('button', { name: /打开任务 修改后的任务名/i })).toBeInTheDocument()

    const updated = useTaskStore.getState().tasks.find((task) => task.title === '修改后的任务名')
    expect(updated).toBeDefined()
    expect(new Date(updated?.stats.completedAt ?? '').toISOString()).toBe(new Date('2026-04-20T10:30').toISOString())
  })

  it('shows estimated days input in task form', async () => {
    render(<MatrixView />)

    fireEvent.click(screen.getByRole('button', { name: /新建任务/i }))

    const estimatedDaysInput = screen.getByLabelText(/预计天数/i)
    expect(estimatedDaysInput).toHaveAttribute('type', 'number')
    expect(estimatedDaysInput).toHaveAttribute('min', '1')
    expect(estimatedDaysInput).toHaveAttribute('max', '30')
    expect(estimatedDaysInput).toHaveValue(1)
  })

  it('hides completed tasks from matrix view', async () => {
    useTaskStore.getState().addTask({
      title: 'Visible Task',
      importance: 10,
      urgency: 10,
      tags: [],
    })
    useTaskStore.getState().addTask({
      title: 'Hidden Completed Task',
      importance: 8,
      urgency: 8,
      tags: [],
    })
    const completedTask = useTaskStore.getState().tasks.find((t) => t.title === 'Hidden Completed Task')
    if (completedTask) {
      useTaskStore.getState().updateTask(completedTask.id, { status: 'completed' })
    }

    render(<MatrixView />)

    expect(await screen.findByText('Visible Task')).toBeInTheDocument()
    expect(screen.queryByText('Hidden Completed Task')).not.toBeInTheDocument()
  })
})
