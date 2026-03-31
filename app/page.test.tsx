import { render, screen } from '@testing-library/react'
import { SingerDashboardView } from '../components/singer-dashboard-view'
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

describe('Singer dashboard', () => {
  it('shows the singer experience and hides band admin controls', () => {
    render(<SingerDashboardView {...state} />)

    expect(screen.getByRole('heading', { name: /neon echo/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /singer experience/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /band profile/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /payment links/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /singer actions/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /band management/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /saas admin/i })).not.toBeInTheDocument()
  })
})
