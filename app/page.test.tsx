import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home page', () => {
  it('shows the StageSync Phase 1 dashboard structure', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { name: /stagesync/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /singer experience/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /band management/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /saas admin/i })).toBeInTheDocument()
  })

  it('includes the core phase 1 singer flow', () => {
    render(<Home />)

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /tidal song search/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /live queue/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /lyrics/i })).toBeInTheDocument()
  })

  it('includes band profile and admin information', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { name: /band profile/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /payment links/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /system analytics/i })).toBeInTheDocument()
  })
})
