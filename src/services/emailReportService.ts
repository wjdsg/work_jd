// Author: mjw
// Date: 2026-04-17

import { TaskRecord } from '../models/task'
import { UserSettings } from '../models/settings'

const DAY_MS = 24 * 60 * 60 * 1000

function parseScheduleStart(startDate: string, sendTime: string) {
  const value = `${startDate}T${sendTime}:00`
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function computeDueCycleStart(now: Date, settings: UserSettings['emailReport']) {
  const start = parseScheduleStart(settings.startDate, settings.sendTime)
  if (!start) return null
  const intervalDays = Math.max(1, Math.floor(settings.intervalDays))
  const intervalMs = intervalDays * DAY_MS

  if (now.getTime() < start.getTime()) return start

  const elapsedMs = now.getTime() - start.getTime()
  const cycles = Math.floor(elapsedMs / intervalMs)
  return new Date(start.getTime() + cycles * intervalMs)
}

export function shouldSendEmailReport(settings: UserSettings['emailReport'], now: Date, lastSentAt?: string) {
  if (!settings.enabled) return false
  if (!settings.senderEmail || !settings.senderAuthCode || !settings.recipientEmail) return false

  const dueStart = computeDueCycleStart(now, settings)
  if (!dueStart) return false
  if (now.getTime() < dueStart.getTime()) return false

  if (!lastSentAt) return true
  const last = new Date(lastSentAt)
  if (Number.isNaN(last.getTime())) return true
  return last.getTime() < dueStart.getTime()
}

export function buildEmailSummary(tasks: TaskRecord[], now: Date) {
  const completed = tasks.filter((task) => task.status === 'completed').length
  const inProgress = tasks.filter((task) => task.status === 'in-progress').length
  const todo = tasks.filter((task) => task.status === 'todo').length

  const overdue = tasks.filter((task) => {
    if (!task.dueDate) return false
    if (task.status === 'completed') return false
    const due = new Date(task.dueDate)
    if (Number.isNaN(due.getTime())) return false
    return due.getTime() < now.getTime()
  }).length

  const quadrantCount = {
    q1: tasks.filter((task) => task.quadrant === 'q1').length,
    q2: tasks.filter((task) => task.quadrant === 'q2').length,
    q3: tasks.filter((task) => task.quadrant === 'q3').length,
    q4: tasks.filter((task) => task.quadrant === 'q4').length,
  }

  const dateLabel = now.toISOString().slice(0, 10)
  const subject = `[Core Matrix] ${dateLabel} 任务摘要`
  const text = [
    `日期: ${dateLabel}`,
    '',
    '任务状态统计:',
    `- 待办: ${todo}`,
    `- 进行中: ${inProgress}`,
    `- 已完成: ${completed}`,
    `- 逾期: ${overdue}`,
    '',
    '象限分布:',
    `- Q1 重要且紧急: ${quadrantCount.q1}`,
    `- Q2 重要不紧急: ${quadrantCount.q2}`,
    `- Q3 紧急不重要: ${quadrantCount.q3}`,
    `- Q4 不重要不紧急: ${quadrantCount.q4}`,
  ].join('\n')

  return { subject, text }
}
