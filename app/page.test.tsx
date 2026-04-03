import { render, screen } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SingerDashboardView } from '../components/singer-dashboard-view'
import { buildDashboardState } from '../lib/dashboard'
import { buildRootAuthRedirect } from '../lib/root-auth'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

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

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/songs/search?bandId=')))

    expect(screen.getByRole('heading', { name: /neon echo/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /sign-up/i }).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument()
    expect(screen.getByText(/band profile/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /pick a song/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /live queue/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /band management/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /saas admin/i })).not.toBeInTheDocument()
  })

  it('hides the auth buttons when the singer is signed in', () => {
    render(<SingerDashboardView {...state} singerName="Maya Chen" currentRequest={{ artist: 'Fleetwood Mac', title: 'Dreams' }} />)

    expect(screen.queryByRole('button', { name: /^sign-up$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^login$/i })).not.toBeInTheDocument()
    expect(screen.getByText(/maya chen/i)).toBeInTheDocument()
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
