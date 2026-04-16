// Author: mjw
// Date: 2026-04-15

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useTaskStore } from '../../store/taskStore'
import '../placeholders/styles/placeholders.css'

function toIsoDayKey(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

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

export default function CalendarPlaceholder() {
  const tasks = useTaskStore((state) => state.tasks)
  const [currentMonth] = useState(() => new Date())

  const scheduledTasksByDay = useMemo(() => {
    const byDay = new Map<string, typeof tasks>()
    tasks.forEach((task) => {
      if (!task.dueDate) return
      const parsed = new Date(task.dueDate)
      if (Number.isNaN(parsed.getTime())) return
      const key = toIsoDayKey(parsed)
      const prev = byDay.get(key) ?? []
      byDay.set(key, [...prev, task])
    })

    byDay.forEach((dayTasks, key) => {
      const sorted = [...dayTasks].sort((a, b) => {
        const dueDelta = new Date(a.dueDate ?? '').getTime() - new Date(b.dueDate ?? '').getTime()
        if (dueDelta !== 0) return dueDelta
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
      byDay.set(key, sorted)
    })

    return byDay
  }, [tasks])

  const { firstDay, days } = useMemo(() => buildMonthDays(currentMonth), [currentMonth])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const selectedDayTasks = scheduledTasksByDay.get(selectedDay) ?? []

  return (
    <div className="placeholder-view">
      <section className="placeholder-hero">
        <h2>日历规划</h2>
        <p>仅展示有 deadline 的任务，按日期聚合查看执行安排。</p>
      </section>
      <section className="calendar-board" aria-label="日历月视图">
        <header className="calendar-month-title">{format(currentMonth, 'yyyy年M月')}</header>
        <div className="calendar-grid" style={{ gridColumnStart: firstDay.getDay() + 1 }}>
          {days.map((day) => {
            const dayKey = toIsoDayKey(day)
            const dayTasks = scheduledTasksByDay.get(dayKey) ?? []
            const summaries = dayTasks.slice(0, 2)
            const remainCount = Math.max(dayTasks.length - 2, 0)
            return (
              <article key={dayKey} className="calendar-day" data-testid={`calendar-day-${dayKey}`}>
                <button type="button" className="calendar-day-trigger" aria-label={`查看 ${dayKey}`} onClick={() => setSelectedDay(dayKey)}>
                  <strong>{day.getDate()}</strong>
                </button>
                <ul className="calendar-day-list">
                  {summaries.map((task) => (
                    <li key={task.id}>{task.title}</li>
                  ))}
                </ul>
                {remainCount > 0 ? <p className="calendar-day-more">+{remainCount}</p> : null}
              </article>
            )
          })}
        </div>
      </section>

      <section className="calendar-selected-tasks" aria-label="当天任务">
        <h3>当天任务（{selectedDay ?? '未选择日期'}）</h3>
        {selectedDay === null ? (
          <p>请先选择日期</p>
        ) : selectedDayTasks.length === 0 ? (
          <p>暂无任务</p>
        ) : (
          <ul>
            {selectedDayTasks.map((task) => (
              <li key={task.id} data-testid="selected-day-task">
                {task.title}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
