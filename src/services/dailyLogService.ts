// Author: mjw
// Date: 2026-04-16

import type { TaskRecord } from '../models/task'

export interface DailyLogItem {
  date: string
  taskId: string
  title: string
  event: 'task_completed'
  at: string
}

const LOG_KEY = 'daily-work-log'
const MAX_LOG_ITEMS = 5000

function getLocalDateString(now: Date) {
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function readDailyLogs(): DailyLogItem[] {
  const payload = localStorage.getItem(LOG_KEY)
  if (!payload) return []
  try {
    const parsed = JSON.parse(payload)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function appendCompletedLog(task: Pick<TaskRecord, 'id' | 'title'>): DailyLogItem {
  const now = new Date()
  const nextLog: DailyLogItem = {
    date: getLocalDateString(now),
    taskId: task.id,
    title: task.title,
    event: 'task_completed',
    at: now.toISOString(),
  }

  const logs = readDailyLogs()
  const next = [...logs, nextLog].slice(-MAX_LOG_ITEMS)
  localStorage.setItem(LOG_KEY, JSON.stringify(next))
  return nextLog
}
