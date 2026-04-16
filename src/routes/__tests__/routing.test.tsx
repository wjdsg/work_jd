import { beforeEach, describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routesConfig } from '../config'
import { useTaskStore } from '../../store/taskStore'

describe('App routing', () => {
  beforeEach(() => {
    useTaskStore.getState().clear()
  })

  it('renders Matrix route by default', async () => {
    const router = createMemoryRouter(routesConfig, { initialEntries: ['/matrix'] })
    render(<RouterProvider router={router} />)
    expect(await screen.findByText(/重要性 x 紧急性矩阵/i)).toBeInTheDocument()
  })

  it('renders calendar page instead of placeholder copy', async () => {
    const router = createMemoryRouter(routesConfig, { initialEntries: ['/calendar'] })
    render(<RouterProvider router={router} />)

    expect(await screen.findByText(/仅展示有 deadline 的任务/i, {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByText(/日历规划路线图/i)).not.toBeInTheDocument()
  })

  it('renders scheduled tasks only on calendar route', async () => {
    useTaskStore.getState().addTask({
      title: 'with-due-date',
      importance: 10,
      urgency: 10,
      dueDate: '2026-04-20T09:00:00.000Z',
      tags: [],
    })
    useTaskStore.getState().addTask({
      title: 'without-due-date',
      importance: 10,
      urgency: 10,
      tags: [],
    })
    useTaskStore.getState().addTask({
      title: 'invalid-due-date',
      importance: 10,
      urgency: 10,
      dueDate: 'not-a-date',
      tags: [],
    })

    const router = createMemoryRouter(routesConfig, { initialEntries: ['/calendar'] })
    render(<RouterProvider router={router} />)

    expect(await screen.findByText(/仅展示有 deadline 的任务/i, {}, { timeout: 5000 })).toBeInTheDocument()
    
    const withDueDateElements = await screen.findAllByText('with-due-date', {}, { timeout: 5000 })
    expect(withDueDateElements.length).toBeGreaterThan(0)
    
    const withoutDueDateElements = await screen.findAllByText('without-due-date', {}, { timeout: 5000 })
    expect(withoutDueDateElements.length).toBeGreaterThan(0)
    
    expect(screen.queryByText('invalid-due-date')).not.toBeInTheDocument()
  })

  it('shows selected day task list below calendar after date click', async () => {
    useTaskStore.getState().addTask({
      title: 'click-day-task',
      importance: 10,
      urgency: 10,
      dueDate: '2026-04-10T10:00:00.000Z',
      tags: [],
    })

    const router = createMemoryRouter(routesConfig, { initialEntries: ['/calendar'] })
    render(<RouterProvider router={router} />)

    fireEvent.click(await screen.findByRole('button', { name: /查看 2026-04-10/i }))

    expect(await screen.findByText(/当天任务/i)).toBeInTheDocument()
    expect(screen.getByTestId('selected-day-task')).toHaveTextContent('click-day-task')
  })

  it('shows max two summaries with +N and keeps dueDate-createdAt ordering', async () => {
    useTaskStore.getState().addTask({
      title: 'ordered-2',
      importance: 10,
      urgency: 10,
      dueDate: '2026-04-18T11:00:00.000Z',
      tags: [],
    })
    useTaskStore.getState().addTask({
      title: 'ordered-1',
      importance: 10,
      urgency: 10,
      dueDate: '2026-04-18T09:00:00.000Z',
      tags: [],
    })
    useTaskStore.getState().addTask({
      title: 'ordered-3',
      importance: 10,
      urgency: 10,
      dueDate: '2026-04-18T13:00:00.000Z',
      tags: [],
    })

    const router = createMemoryRouter(routesConfig, { initialEntries: ['/calendar'] })
    render(<RouterProvider router={router} />)

    const dayCell = await screen.findByTestId('calendar-day-2026-04-18')
    expect(dayCell).toHaveTextContent('ordered-1')
    expect(dayCell).toHaveTextContent('ordered-2')
    expect(dayCell).toHaveTextContent('+1')

    fireEvent.click(await screen.findByRole('button', { name: /查看 2026-04-18/i }))
    const items = await screen.findAllByTestId('selected-day-task')
    expect(items[0]).toHaveTextContent('ordered-1')
    expect(items[1]).toHaveTextContent('ordered-2')
    expect(items[2]).toHaveTextContent('ordered-3')
  })
})
