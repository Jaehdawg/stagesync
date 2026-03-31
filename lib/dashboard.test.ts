import { describe, expect, it } from 'vitest'
import { buildDashboardState } from './dashboard'

describe('buildDashboardState', () => {
  it('uses band profile data when present', () => {
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

    expect(state.brand.title).toBe('Neon Echo')
    expect(state.analytics).toEqual([
      { label: 'Active Show', value: '🤘' },
      { label: 'Songs in queue', value: '11' },
      { label: 'Queued singers', value: '7' },
    ])
    expect(state.bandLinks[0]).toEqual({ label: 'Facebook', href: 'https://facebook.com/neonecho' })
    expect(state.paymentLinks[0]).toEqual({ label: 'PayPal', href: 'https://paypal.me/neonecho' })
    expect(state.customMessage).toBe('Tip us and request your favorite throwback.')
    expect(state.signupEnabled).toBe(true)
    expect(state.signupStatusMessage).toMatch(/sign up while the show is active/i)
    expect(state.queueItems[0]).toEqual({
      id: null,
      position: 1,
      name: 'Avery',
      song: 'Maps - Yeah Yeah Yeahs',
      status: 'Now singing',
    })
  })

  it('preserves queue item ids for band controls', () => {
    const state = buildDashboardState({
      queueItems: [
        { id: 'queue-1', position: 1, name: 'Avery', song: 'Maps - Yeah Yeah Yeahs', status: 'Now singing' },
      ],
    })

    expect(state.queueItems[0]).toMatchObject({
      id: 'queue-1',
      position: 1,
      name: 'Avery',
      song: 'Maps - Yeah Yeah Yeahs',
      status: 'Now singing',
    })
  })

  it('falls back to defaults when data is missing', () => {
    const state = buildDashboardState()

    expect(state.brand.title).toBe('StageSync')
    expect(state.queueItems).toHaveLength(3)
    expect(state.bandLinks[3]).toEqual({ label: 'Website', href: 'https://example.com' })
  })
})
