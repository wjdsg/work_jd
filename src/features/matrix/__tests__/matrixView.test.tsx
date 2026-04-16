// Author: mjw
// Date: 2026-04-15

import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import MatrixView from '../MatrixView'
import { useTaskStore } from '../../../store/taskStore'

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

  it('creates a task from the form and shows it in expected quadrant', async () => {
    render(<MatrixView />)

    fireEvent.click(screen.getByRole('button', { name: /新建任务/i }))
    fireEvent.change(screen.getByLabelText(/标题/i), { target: { value: '准备冲刺演示' } })
    fireEvent.change(screen.getByLabelText(/^重要性$/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/^紧急性$/i), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /保存任务/i }))

    expect(await screen.findByText('准备冲刺演示')).toBeInTheDocument()
    expect(within(screen.getByTestId('quadrant-q1')).getByText('准备冲刺演示')).toBeInTheDocument()
  })

  it('moves task with keyboard interaction between quadrants', async () => {
    useTaskStore.getState().addTask({
      title: '键盘移动任务',
      importance: 5,
      urgency: 5,
      tags: [],
    })

    render(<MatrixView />)

    const taskCard = await screen.findByRole('button', { name: /打开任务 键盘移动任务/i })
    fireEvent.keyDown(taskCard, { key: 'ArrowDown' })

    expect(within(screen.getByTestId('quadrant-q2')).getByText('键盘移动任务')).toBeInTheDocument()
  })
})
