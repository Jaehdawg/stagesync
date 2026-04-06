import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivacyPage from './page'

describe('PrivacyPage', () => {
  it('renders the privacy policy shell', () => {
    render(<PrivacyPage />)

    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument()
    expect(screen.getByText(/payment credentials stay with the hosted payment provider/i)).toBeInTheDocument()
    expect(screen.getByText(/account and show data/i)).toBeInTheDocument()
  })
})
