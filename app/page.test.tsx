import { render, screen } from '@testing-library/react'
import { DashboardView } from '../components/dashboard-view'
import { buildDashboardState } from '../lib/dashboard'

const state = buildDashboardState({
  bandProfile: {
    band_name: 'Neon Echo',
    website_url: 'https://neonecho.example',
    facebook_url: 'https://facebook.com/neonecho',
    instagram_url: 'https://instagram.com/neonecho',
    tiktok_url: 'https://tiktok.com/@neonecho',
    paypal_url: 'https://paypal.me/neonecho',
    venmo_url: 'https://venmo.com/u/neonecho',
    cashapp_url: 'https://cash.app/$neonecho',
    custom_message: 'Tip us and request your favorite throwback.',
  },
  activeShowCount: 4,
  songsInQueue: 11,
  queuedSingers: 7,
  queueItems: [
    { position: 1, name: 'Avery', song: 'Maps - Yeah Yeah Yeahs', status: 'Now singing' },
  ],
})

describe('Home page', () => {
  it('shows the StageSync Phase 1 dashboard structure', () => {
    render(<DashboardView {...state} />)

    expect(screen.getByRole('heading', { name: /neon echo/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /singer experience/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /band management/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /saas admin/i })).toBeInTheDocument()
  })

  it('includes the core phase 1 singer flow', () => {
    render(<DashboardView {...state} />)

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /tidal song search/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /live queue/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /lyrics/i })).toBeInTheDocument()
  })

  it('includes band profile and admin information', () => {
    render(<DashboardView {...state} />)

    expect(screen.getByRole('heading', { name: /band profile/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /payment links/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /system analytics/i })).toBeInTheDocument()
  })
})
