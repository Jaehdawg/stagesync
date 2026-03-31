import { render, screen } from '@testing-library/react'
import { BandDashboardView } from './band-dashboard-view'

const state = {
  brand: {
    label: 'Phase 1 build',
    title: 'Neon Echo',
    description: 'Band dashboard',
  },
  analytics: [
    { label: 'Active shows', value: '1' },
    { label: 'Songs in queue', value: '12' },
    { label: 'Queued singers', value: '6' },
  ],
  queueItems: [
    { position: 1, name: 'Avery', song: 'Maps - Yeah Yeah Yeahs', status: 'Now singing' },
  ],
  bandLinks: [{ label: 'Website', href: 'https://example.com' }],
  paymentLinks: [{ label: 'PayPal', href: 'https://paypal.com' }],
  customMessage: 'Thanks!',
}

describe('BandDashboardView', () => {
  it('shows band controls without singer signup sections', () => {
    render(<BandDashboardView {...state} />)

    expect(screen.getByRole('heading', { name: /show controls/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /queue management/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /quick registration/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /singer experience/i })).not.toBeInTheDocument()
  })
})
