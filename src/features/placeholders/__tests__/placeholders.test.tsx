// Author: mjw
// Date: 2026-04-15

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CalendarPlaceholder from '../../calendar/CalendarPlaceholder'
import InsightsPlaceholder from '../../insights/InsightsPlaceholder'

describe('Feature placeholders', () => {
  it('renders calendar roadmap sections', () => {
    render(<CalendarPlaceholder />)
    expect(screen.getByRole('heading', { name: /日历规划中枢/i })).toBeInTheDocument()
    expect(screen.getByText(/时间轴视图/i)).toBeInTheDocument()
    expect(screen.getByText(/拖拽排程/i)).toBeInTheDocument()
  })

  it('renders insights roadmap sections', () => {
    render(<InsightsPlaceholder />)
    expect(screen.getByRole('heading', { name: /洞察驾驶舱/i })).toBeInTheDocument()
    expect(screen.getByText(/专注评分/i)).toBeInTheDocument()
    expect(screen.getByText(/习惯信号/i)).toBeInTheDocument()
  })
})
