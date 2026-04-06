import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TermsPage from './page'

describe('TermsPage', () => {
  it('renders the PCI boundary summary and rules', () => {
    render(<TermsPage />)

    expect(screen.getByRole('heading', { name: /terms \/ terms of service/i })).toBeInTheDocument()
    expect(screen.getByText(/StageSync keeps payment data outside its PCI boundary/i)).toBeInTheDocument()
    expect(screen.getByText(/hosted payments only/i)).toBeInTheDocument()
    expect(screen.getByText(/no raw card storage/i)).toBeInTheDocument()
  })
})
