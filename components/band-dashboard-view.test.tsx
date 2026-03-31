import { render, screen } from '@testing-library/react'
import { BandDashboardView } from './band-dashboard-view'

const state = {
  brand: {
    label: 'StageSync',
    title: 'Neon Echo',
    description: 'Band dashboard',
  },
  analytics: [
    { label: '🤘 Active Show', value: '1' },
    { label: 'Songs in queue', value: '12' },
    { label: 'Queued singers', value: '6' },
  ],
  queueItems: [
    { position: 1, name: 'Avery', song: 'Maps - Yeah Yeah Yeahs', status: 'Now singing' },
  ],
  bandLinks: [{ label: 'Website', href: 'https://example.com' }],
  paymentLinks: [{ label: 'PayPal', href: 'https://paypal.com' }],
  customMessage: 'Thanks!',
  currentShowId: 'show-1',
  showState: 'active' as const,
  signupStatusMessage: 'Signups are open.',
}

describe('BandDashboardView', () => {
  it('shows band controls without singer signup sections', () => {
    render(<BandDashboardView {...state} />)

    expect(screen.getByRole('heading', { name: /show controls/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /queue management/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /quick registration/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /singer experience/i })).not.toBeInTheDocument()
  })

  it('shows a create show form when there is no current show in test mode', () => {
    render(<BandDashboardView {...state} currentShowId={null} testMode currentShowName={null} />)

    expect(screen.getByRole('button', { name: /create show/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pause signups/i })).not.toBeInTheDocument()
  })

  it('shows show settings when a test show exists', () => {
    render(
      <BandDashboardView
        {...state}
        currentShowId="show-1"
        currentShowName="Saturday Night"
        testMode
        showDurationMinutes={90}
        signupBufferMinutes={2}
      />
    )

    expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/show duration/i)).toHaveValue(90)
    expect(screen.getByLabelText(/buffer between songs/i)).toHaveValue(2)
  })

  it('shows band profile editing in test mode', () => {
    render(<BandDashboardView {...state} testMode currentShowId={null} currentShowName={null} />)

    expect(screen.getByRole('button', { name: /save band profile/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/band name/i)).toHaveValue('Neon Echo')
  })
})
