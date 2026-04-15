// Author: mjw
// Date: 2026-04-15

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CalendarPlaceholder from '../../calendar/CalendarPlaceholder'
import InsightsPlaceholder from '../../insights/InsightsPlaceholder'

describe('Feature placeholders', () => {
  it('renders calendar roadmap sections', () => {
    render(<CalendarPlaceholder />)
    expect(screen.getByRole('heading', { name: /calendar planning hub/i })).toBeInTheDocument()
    expect(screen.getByText(/timeline view/i)).toBeInTheDocument()
    expect(screen.getByText(/drag to schedule/i)).toBeInTheDocument()
  })

  it('renders insights roadmap sections', () => {
    render(<InsightsPlaceholder />)
    expect(screen.getByRole('heading', { name: /insights cockpit/i })).toBeInTheDocument()
    expect(screen.getByText(/focus score/i)).toBeInTheDocument()
    expect(screen.getByText(/habit signals/i)).toBeInTheDocument()
  })
})
