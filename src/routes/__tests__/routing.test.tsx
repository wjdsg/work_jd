import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routesConfig } from '../config'

describe('App routing', () => {
  it('renders Matrix route by default', async () => {
    const router = createMemoryRouter(routesConfig, { initialEntries: ['/matrix'] })
    render(<RouterProvider router={router} />)
    expect(await screen.findByText(/Matrix/i)).toBeInTheDocument()
  })
})
