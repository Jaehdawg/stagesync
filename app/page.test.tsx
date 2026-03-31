import { render, screen } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { SingerDashboardView } from '../components/singer-dashboard-view'
import { buildDashboardState } from '../lib/dashboard'
import { buildRootAuthRedirect } from '../lib/root-auth'

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
  songSourceMode: 'uploaded',
})

describe('Singer dashboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the singer experience and hides band admin controls', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tracks: [{ id: 'song-1', title: 'Dreams', artist: 'Fleetwood Mac' }] }),
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<SingerDashboardView {...state} />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/songs/search?query='))

    expect(screen.getByRole('heading', { name: /neon echo/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /singer sign-up/i })).toBeInTheDocument()
    expect(screen.getAllByText(/band links/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/tip links/i).length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: /band management/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /saas admin/i })).not.toBeInTheDocument()
  })

  it('redirects auth codes from the root page to the callback route', async () => {
    expect(
      buildRootAuthRedirect({
        code: 'abc123',
        role: 'band',
        siteUrl: 'https://stagesync-six.vercel.app',
      })
    ).toBe('https://stagesync-six.vercel.app/auth/callback?code=abc123&role=band')
  })
})
