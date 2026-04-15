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

    expect(screen.getByRole('heading', { name: /importance x urgency matrix/i })).toBeInTheDocument()
    expect(screen.getByTestId('quadrant-q1')).toBeInTheDocument()
    expect(screen.getByTestId('quadrant-q2')).toBeInTheDocument()
    expect(screen.getByTestId('quadrant-q3')).toBeInTheDocument()
    expect(screen.getByTestId('quadrant-q4')).toBeInTheDocument()
    expect(screen.getAllByText(/no tasks yet/i)).toHaveLength(4)
  })

  it('creates a task from the form and shows it in expected quadrant', async () => {
    render(<MatrixView />)

    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Prepare sprint demo' } })
    fireEvent.change(screen.getByLabelText(/^importance$/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/^urgency$/i), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /save task/i }))

    expect(await screen.findByText('Prepare sprint demo')).toBeInTheDocument()
    expect(within(screen.getByTestId('quadrant-q1')).getByText('Prepare sprint demo')).toBeInTheDocument()
  })

  it('moves task with keyboard interaction between quadrants', async () => {
    useTaskStore.getState().addTask({
      title: 'Move with keyboard',
      importance: 5,
      urgency: 5,
      tags: [],
    })

    render(<MatrixView />)

    const taskCard = await screen.findByRole('button', { name: /open task move with keyboard/i })
    fireEvent.keyDown(taskCard, { key: 'ArrowDown' })

    expect(within(screen.getByTestId('quadrant-q2')).getByText('Move with keyboard')).toBeInTheDocument()
  })
})
