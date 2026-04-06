import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SupportPage from './page'

describe('SupportPage', () => {
  it('renders the support shell', () => {
    render(<SupportPage />)

    expect(screen.getByRole('heading', { name: /support/i })).toBeInTheDocument()
    expect(screen.getByText(/support for stagesync is currently handled/i)).toBeInTheDocument()
    expect(screen.getByText(/billing help/i)).toBeInTheDocument()
  })
})
