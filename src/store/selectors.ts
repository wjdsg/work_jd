import { TaskRecord, TaskFilter, TaskSort } from '../models/task'

export function applyFilters(tasks: TaskRecord[], filter: TaskFilter): TaskRecord[] {
  return tasks.filter((task) => {
    if (filter.quadrant && task.quadrant !== filter.quadrant) return false
    if (filter.status && task.status !== filter.status) return false
    if (filter.tags && filter.tags.length) {
      if (!filter.tags.every((tag) => task.tags.includes(tag))) return false
    }
    if (filter.search) {
      const lower = filter.search.toLowerCase()
      if (!task.title.toLowerCase().includes(lower) && !task.description?.toLowerCase().includes(lower)) {
        return false
      }
    }
    return true
  })
}

export function applySort(tasks: TaskRecord[], sort: TaskSort): TaskRecord[] {
  const sorted = [...tasks]
  sorted.sort((a, b) => {
    const direction = sort.direction === 'asc' ? 1 : -1
    const key = sort.field
    const aValue = a[key] ?? ''
    const bValue = b[key] ?? ''
    if (aValue === bValue) return 0
    return aValue > bValue ? direction : -direction
  })
  return sorted
}
