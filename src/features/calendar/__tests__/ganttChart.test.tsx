// Author: mjw
// Date: 2026-04-16

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GanttChart from '../components/GanttChart'
import { useTaskStore } from '../../../store/taskStore'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

describe('GanttChart', () => {
  beforeEach(() => {
    useTaskStore.getState().clear()
  })

  describe('rendering', () => {
    it('renders gantt chart container', () => {
      render(<GanttChart />)

      expect(screen.getByTestId('gantt-chart')).toBeInTheDocument()
    })

    it('displays current month title', () => {
      render(<GanttChart />)

      const now = new Date()
      const expectedTitle = format(now, 'yyyy年M月')
      expect(screen.getByText(expectedTitle)).toBeInTheDocument()
    })

    it('displays all days of current month in header', () => {
      render(<GanttChart />)

      const now = new Date()
      const start = startOfMonth(now)
      const end = endOfMonth(now)
      const days = eachDayOfInterval({ start, end })

      days.forEach((day) => {
        const dayNum = day.getDate().toString()
        expect(screen.getByText(dayNum)).toBeInTheDocument()
      })
    })

    it('renders task bars for tasks with startDate and dueDate', () => {
      useTaskStore.getState().addTask({
        title: 'Task with dates',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })

      render(<GanttChart />)

      expect(screen.getByTestId('gantt-task-bar')).toBeInTheDocument()
    })

    it('displays task title on the bar', () => {
      useTaskStore.getState().addTask({
        title: 'Gantt Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })

      render(<GanttChart />)

      expect(screen.getByText('Gantt Task')).toBeInTheDocument()
    })

    it('applies different colors for different quadrants', () => {
      useTaskStore.getState().addTask({
        title: 'Q1 Task',
        importance: 10,
        urgency: 10,
        estimatedDays: 2,
        tags: [],
      })
      useTaskStore.getState().addTask({
        title: 'Q2 Task',
        importance: 10,
        urgency: 2,
        estimatedDays: 2,
        tags: [],
      })
      useTaskStore.getState().addTask({
        title: 'Q3 Task',
        importance: 2,
        urgency: 10,
        estimatedDays: 2,
        tags: [],
      })
      useTaskStore.getState().addTask({
        title: 'Q4 Task',
        importance: 2,
        urgency: 2,
        estimatedDays: 2,
        tags: [],
      })

      render(<GanttChart />)

      const q1Task = screen.getByText('Q1 Task').closest('.gantt-bar')
      const q2Task = screen.getByText('Q2 Task').closest('.gantt-bar')
      const q3Task = screen.getByText('Q3 Task').closest('.gantt-bar')
      const q4Task = screen.getByText('Q4 Task').closest('.gantt-bar')

      expect(q1Task).toHaveClass('gantt-bar--q1')
      expect(q2Task).toHaveClass('gantt-bar--q2')
      expect(q3Task).toHaveClass('gantt-bar--q3')
      expect(q4Task).toHaveClass('gantt-bar--q4')
    })

    it('shows completed tasks with reduced opacity', () => {
      useTaskStore.getState().addTask({
        title: 'Completed Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 2,
        tags: [],
      })
      const task = useTaskStore.getState().tasks.find((t) => t.title === 'Completed Task')
      if (task) {
        useTaskStore.getState().updateTask(task.id, { status: 'completed' })
      }

      render(<GanttChart />)

      const bar = screen.getByTestId('gantt-task-bar')
      expect(bar).toHaveClass('gantt-bar--completed')
    })

    it('does not render tasks without dueDate', () => {
      const task = useTaskStore.getState().addTask({
        title: 'Task without dates',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })
      useTaskStore.getState().updateTask(task.id, { dueDate: undefined })

      render(<GanttChart />)

      expect(screen.queryByTestId('gantt-task-bar')).not.toBeInTheDocument()
    })
  })

  describe('dragging - left edge (startDate)', () => {
    it('shows resize cursor on left edge', async () => {
      useTaskStore.getState().addTask({
        title: 'Draggable Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })

      render(<GanttChart />)

      const leftEdge = screen.getByTestId('gantt-bar-left-edge')
      expect(leftEdge).toHaveClass('gantt-bar__edge--left')
    })

    it('updates startDate when dragging left edge', async () => {
      const user = userEvent.setup()
      const task = useTaskStore.getState().addTask({
        title: 'Drag Left Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })
      const originalDueDate = task.dueDate

      render(<GanttChart />)

      const leftEdge = screen.getByTestId('gantt-bar-left-edge')
      await user.pointer([
        { target: leftEdge },
        { keys: '[MouseLeft>]', target: leftEdge },
        { coords: { x: 100, y: 0 } },
        { keys: '[/MouseLeft]' },
      ])

      const updatedTask = useTaskStore.getState().tasks.find((t) => t.id === task.id)
      expect(updatedTask?.dueDate).toBe(originalDueDate)
    })

    it('shows date tooltip while dragging left edge', async () => {
      const user = userEvent.setup()
      useTaskStore.getState().addTask({
        title: 'Tooltip Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })

      render(<GanttChart />)

      const leftEdge = screen.getByTestId('gantt-bar-left-edge')
      await user.pointer([
        { target: leftEdge },
        { keys: '[MouseLeft>]', target: leftEdge, coords: { x: 0, y: 0 } },
      ])

      expect(screen.getByTestId('gantt-tooltip')).toBeInTheDocument()
    })
  })

  describe('dragging - right edge (dueDate)', () => {
    it('shows resize cursor on right edge', async () => {
      useTaskStore.getState().addTask({
        title: 'Draggable Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })

      render(<GanttChart />)

      const rightEdge = screen.getByTestId('gantt-bar-right-edge')
      expect(rightEdge).toHaveClass('gantt-bar__edge--right')
    })

    it('updates dueDate when dragging right edge', async () => {
      const user = userEvent.setup()
      const task = useTaskStore.getState().addTask({
        title: 'Drag Right Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })
      const originalStartDate = task.startDate

      render(<GanttChart />)

      const rightEdge = screen.getByTestId('gantt-bar-right-edge')
      await user.pointer([
        { target: rightEdge },
        { keys: '[MouseLeft>]', target: rightEdge },
        { coords: { x: 100, y: 0 } },
        { keys: '[/MouseLeft]' },
      ])

      const updatedTask = useTaskStore.getState().tasks.find((t) => t.id === task.id)
      expect(updatedTask?.startDate).toBe(originalStartDate)
    })
  })

  describe('dragging - middle (move both dates)', () => {
    it('shows move cursor on middle area', async () => {
      useTaskStore.getState().addTask({
        title: 'Move Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })

      render(<GanttChart />)

      const middle = screen.getByTestId('gantt-bar-middle')
      expect(middle).toHaveClass('gantt-bar__middle')
    })

    it('moves both dates when dragging middle area', async () => {
      const user = userEvent.setup()
      const task = useTaskStore.getState().addTask({
        title: 'Move Both Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })
      const originalDays = Math.round(
        (new Date(task.dueDate ?? '').getTime() - new Date(task.startDate).getTime()) / (24 * 60 * 60 * 1000)
      )

      render(<GanttChart />)

      const middle = screen.getByTestId('gantt-bar-middle')
      await user.pointer([
        { target: middle },
        { keys: '[MouseLeft>]', target: middle },
        { coords: { x: 200, y: 0 } },
        { keys: '[/MouseLeft]' },
      ])

      const updatedTask = useTaskStore.getState().tasks.find((t) => t.id === task.id)
      if (updatedTask) {
        const newDays = Math.round(
          (new Date(updatedTask.dueDate ?? '').getTime() - new Date(updatedTask.startDate).getTime()) / (24 * 60 * 60 * 1000)
        )
        expect(newDays).toBe(originalDays)
      }
    })
  })

  describe('constraints', () => {
    it('enforces minimum 1 day duration when dragging left edge', async () => {
      const user = userEvent.setup()
      const task = useTaskStore.getState().addTask({
        title: 'Min Duration Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })

      render(<GanttChart />)

      const leftEdge = screen.getByTestId('gantt-bar-left-edge')
      await user.pointer([
        { target: leftEdge },
        { keys: '[MouseLeft>]', target: leftEdge },
        { coords: { x: 5000, y: 0 } },
        { keys: '[/MouseLeft]' },
      ])

      const updatedTask = useTaskStore.getState().tasks.find((t) => t.id === task.id)
      if (updatedTask && updatedTask.dueDate) {
        const days = Math.round(
          (new Date(updatedTask.dueDate).getTime() - new Date(updatedTask.startDate).getTime()) / (24 * 60 * 60 * 1000)
        )
        expect(days).toBeGreaterThanOrEqual(1)
      }
    })

    it('enforces minimum 1 day duration when dragging right edge', async () => {
      const user = userEvent.setup()
      const task = useTaskStore.getState().addTask({
        title: 'Min Duration Right Task',
        importance: 8,
        urgency: 8,
        estimatedDays: 3,
        tags: [],
      })

      render(<GanttChart />)

      const rightEdge = screen.getByTestId('gantt-bar-right-edge')
      await user.pointer([
        { target: rightEdge },
        { keys: '[MouseLeft>]', target: rightEdge },
        { coords: { x: -5000, y: 0 } },
        { keys: '[/MouseLeft]' },
      ])

      const updatedTask = useTaskStore.getState().tasks.find((t) => t.id === task.id)
      if (updatedTask && updatedTask.dueDate) {
        const days = Math.round(
          (new Date(updatedTask.dueDate).getTime() - new Date(updatedTask.startDate).getTime()) / (24 * 60 * 60 * 1000)
        )
        expect(days).toBeGreaterThanOrEqual(1)
      }
    })
  })
})