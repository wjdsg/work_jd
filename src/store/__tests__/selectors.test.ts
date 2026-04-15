import { describe, it, expect } from 'vitest'
import { applyFilters, applySort } from '../selectors'

const mockTasks = [
  { id: '1', title: 'A', description: '', importance: 5, urgency: 5, quadrant: 'q1', status: 'todo', tags: [], reminders: [], stats: { snoozeCount: 0 }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', title: 'B', description: '', importance: 2, urgency: 5, quadrant: 'q3', status: 'completed', tags: ['work'], reminders: [], stats: { snoozeCount: 0 }, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
]

describe('selectors', () => {
  it('filters by status', () => {
    const result = applyFilters(mockTasks, { status: 'completed' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('sorts by createdAt desc', () => {
    const result = applySort(mockTasks, { field: 'createdAt', direction: 'desc' })
    expect(result[0].id).toBe('2')
  })
})
