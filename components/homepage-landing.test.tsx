import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomepageLanding } from './homepage-landing'

describe('HomepageLanding', () => {
  it('renders the conversion-focused homepage sections and CTAs', () => {
    render(<HomepageLanding />)

    expect(screen.getByRole('heading', { name: /live band karaoke and song requests made simple/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /start a free trial/i }).find((link) => (link.getAttribute('href') ?? '').includes('/api/analytics/redirect?eventName=trial.started'))).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /contact sales/i }).find((link) => (link.getAttribute('href') ?? '').includes('/api/analytics/redirect?eventName=pricing.cta.clicked'))).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /learn more/i }).find((link) => link.getAttribute('href') === '#learn-more')).toBeTruthy()
    expect(screen.getByRole('heading', { name: /three steps from doors open to last song/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /bands, singers, and venues all win/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /pricing that fits how live nights actually run/i })).toBeInTheDocument()
    expect(screen.getByText(/built to keep singers happy, the room moving, and the night more profitable/i)).toBeInTheDocument()
  })
})
