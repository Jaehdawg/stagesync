import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TermsPage from './page'

describe('TermsPage', () => {
  it('renders the PCI boundary summary and legal responsibility sections', () => {
    render(<TermsPage />)

    expect(screen.getByRole('heading', { name: /terms \/ terms of service/i })).toBeInTheDocument()
    expect(screen.getByText(/who provides the service/i)).toBeInTheDocument()
    expect(screen.getByText(/user responsibilities/i)).toBeInTheDocument()
    expect(screen.getByText(/payments, refunds, and cancellations/i)).toBeInTheDocument()
    expect(screen.getByText(/warranty disclaimer and limitation of liability/i)).toBeInTheDocument()
    expect(screen.getByText(/StageSync keeps payment data outside its PCI boundary/i)).toBeInTheDocument()
    expect(screen.getByText(/hosted payments only/i)).toBeInTheDocument()
    expect(screen.getByText(/no raw card storage/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: /support/i })).toHaveAttribute('href', '/support')
  })
})
