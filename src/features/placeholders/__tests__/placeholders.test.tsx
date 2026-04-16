// Author: mjw
// Date: 2026-04-15

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CalendarPlaceholder from '../../calendar/CalendarPlaceholder'
import InsightsPlaceholder from '../../insights/InsightsPlaceholder'

describe('Feature placeholders', () => {
  it('renders calendar roadmap sections', () => {
    render(<CalendarPlaceholder />)
    expect(screen.getByRole('heading', { name: /日历规划/i })).toBeInTheDocument()
    expect(screen.getByText(/仅展示有 deadline 的任务/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/日历月视图/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/当天任务/i)).toBeInTheDocument()
  })

  it('renders insights roadmap sections', () => {
    render(<InsightsPlaceholder />)
    expect(screen.getByRole('heading', { name: /洞察驾驶舱/i })).toBeInTheDocument()
    expect(screen.getByText(/专注评分/i)).toBeInTheDocument()
    expect(screen.getByText(/习惯信号/i)).toBeInTheDocument()
  })
})
