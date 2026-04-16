// Author: mjw
// Date: 2026-04-16

import { useMemo, useState, useRef, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, differenceInDays, addDays } from 'date-fns'
import { useTaskStore } from '../../../store/taskStore'
import '../../placeholders/styles/placeholders.css'

function buildMonthDays(baseDate: Date) {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day))
  }
  return { firstDay, days }
}

export default function GanttChart() {
  const tasks = useTaskStore((state) => state.tasks)
  const updateTask = useTaskStore((state) => state.updateTask)
  const [currentMonth] = useState(() => new Date())
  const [dragState, setDragState] = useState<{
    taskId: string
    type: 'left' | 'right' | 'middle'
    startX: number
    startDate: string
    dueDate: string
  } | null>(null)
  const [tooltipDate, setTooltipDate] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const { days } = useMemo(() => buildMonthDays(currentMonth), [currentMonth])

  const ganttTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate || !task.startDate) return false
      const startParsed = new Date(task.startDate)
      const dueParsed = new Date(task.dueDate)
      if (Number.isNaN(startParsed.getTime()) || Number.isNaN(dueParsed.getTime())) return false
      return true
    })
  }, [tasks])

  const getTaskPosition = (task: typeof tasks[0]) => {
    if (!task.startDate || !task.dueDate) return null

    const start = new Date(task.startDate)
    const due = new Date(task.dueDate)
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)

    if (due < monthStart || start > monthEnd) return null

    const visibleStart = start < monthStart ? monthStart : start
    const visibleEnd = due > monthEnd ? monthEnd : due

    const startOffset = differenceInDays(visibleStart, monthStart)
    const duration = differenceInDays(visibleEnd, visibleStart) + 1

    return {
      startOffset: startOffset + 1,
      duration,
      totalDays: days.length,
    }
  }

  const handleMouseDown = (
    e: React.MouseEvent,
    taskId: string,
    type: 'left' | 'right' | 'middle'
  ) => {
    e.preventDefault()
    const task = tasks.find((t) => t.id === taskId)
    if (!task || !task.startDate || !task.dueDate) return

    setDragState({
      taskId,
      type,
      startX: e.clientX,
      startDate: task.startDate,
      dueDate: task.dueDate,
    })
    setTooltipDate(format(new Date(task.startDate), 'yyyy-MM-dd'))
  }

  useEffect(() => {
    if (!dragState) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!chartRef.current) return

      const { type, startX, startDate, dueDate } = dragState
      const deltaX = e.clientX - startX
      const chartWidth = chartRef.current.offsetWidth || 1000
      const dayWidth = chartWidth / days.length
      const daysDelta = Math.round(deltaX / dayWidth)

      const start = new Date(startDate)
      const due = new Date(dueDate)

      if (type === 'left') {
        const newStart = addDays(start, daysDelta)
        if (differenceInDays(due, newStart) >= 1) {
          setTooltipDate(format(newStart, 'yyyy-MM-dd'))
        }
      } else if (type === 'right') {
        const newDue = addDays(due, daysDelta)
        if (differenceInDays(newDue, start) >= 1) {
          setTooltipDate(format(newDue, 'yyyy-MM-dd'))
        }
      } else {
        const newStart = addDays(start, daysDelta)
        const newDue = addDays(due, daysDelta)
        setTooltipDate(`${format(newStart, 'yyyy-MM-dd')} - ${format(newDue, 'yyyy-MM-dd')}`)
      }
    }

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!chartRef.current || !dragState) {
        setDragState(null)
        setTooltipDate(null)
        return
      }

      const { taskId, type, startX, startDate, dueDate } = dragState
      const deltaX = e.clientX - startX
      const chartWidth = chartRef.current.offsetWidth || 1000
      const dayWidth = chartWidth / days.length
      const daysDelta = Math.round(deltaX / dayWidth)

      const start = new Date(startDate)
      const due = new Date(dueDate)

      if (type === 'left') {
        const newStart = addDays(start, daysDelta)
        if (differenceInDays(due, newStart) >= 1) {
          updateTask(taskId, { startDate: newStart.toISOString() })
        }
      } else if (type === 'right') {
        const newDue = addDays(due, daysDelta)
        if (differenceInDays(newDue, start) >= 1) {
          updateTask(taskId, { dueDate: newDue.toISOString() })
        }
      } else {
        const newStart = addDays(start, daysDelta)
        const newDue = addDays(due, daysDelta)
        updateTask(taskId, {
          startDate: newStart.toISOString(),
          dueDate: newDue.toISOString(),
        })
      }

      setDragState(null)
      setTooltipDate(null)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [dragState, days.length, chartRef, updateTask])

  return (
    <div className="gantt-chart" data-testid="gantt-chart" ref={chartRef}>
      <header className="gantt-chart__header">
        <h3>{format(currentMonth, 'yyyy年M月')}</h3>
      </header>
      <div className="gantt-chart__days">
        {days.map((day) => (
          <div key={day.toISOString()} className="gantt-chart__day">
            {day.getDate()}
          </div>
        ))}
      </div>
      <div className="gantt-chart__tasks">
        {ganttTasks.map((task) => {
          const position = getTaskPosition(task)
          if (!position) return null

          const isCompleted = task.status === 'completed'
          const quadrantClass = `gantt-bar--${task.quadrant}`
          const completedClass = isCompleted ? 'gantt-bar--completed' : ''

          return (
            <div
              key={task.id}
              className={`gantt-bar ${quadrantClass} ${completedClass}`}
              data-testid={`gantt-task-bar`}
              style={{
                gridColumn: `${position.startOffset} / span ${position.duration}`,
              }}
            >
              <div
                className="gantt-bar__edge gantt-bar__edge--left"
                data-testid="gantt-bar-left-edge"
                onMouseDown={(e) => handleMouseDown(e, task.id, 'left')}
              />
              <div
                className="gantt-bar__middle"
                data-testid="gantt-bar-middle"
                onMouseDown={(e) => handleMouseDown(e, task.id, 'middle')}
              >
                <span className="gantt-bar__title">{task.title}</span>
              </div>
              <div
                className="gantt-bar__edge gantt-bar__edge--right"
                data-testid="gantt-bar-right-edge"
                onMouseDown={(e) => handleMouseDown(e, task.id, 'right')}
              />
            </div>
          )
        })}
      </div>
      {tooltipDate && (
        <div className="gantt-tooltip" data-testid="gantt-tooltip">
          {tooltipDate}
        </div>
      )}
    </div>
  )
}