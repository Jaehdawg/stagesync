import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authGetUserMock = vi.fn()
const bandsData = [{ id: 'band-1', band_name: 'Finding North' }]
const bandProfileRow = {
  band_name: 'Finding North',
  website_url: 'https://findingnorth.example',
  facebook_url: 'https://facebook.com/findingnorth',
  instagram_url: 'https://instagram.com/findingnorth',
  tiktok_url: 'https://tiktok.com/@findingnorth',
  paypal_url: 'https://paypal.me/findingnorth',
  venmo_url: 'https://venmo.com/u/findingnorth',
  cashapp_url: 'https://cash.app/$findingnorth',
  custom_message: 'Request a song and tip the band.',
}
const showRow = { id: 'show-1', band_id: 'band-1', name: 'Oteys', is_active: true, allow_signups: true }
const settingsRow = { show_duration_minutes: 90, signup_buffer_minutes: 2, song_source_mode: 'uploaded', tidal_playlist_url: null }
const queueRows = [
  { id: 'queue-1', event_id: 'show-1', performer_id: 'singer-1', song_id: 'song-1', status: 'queued', position: 1, created_at: '2026-04-01T21:00:00Z' },
  { id: 'queue-2', event_id: 'show-1', performer_id: 'singer-2', song_id: 'song-2', status: 'played', position: 2, created_at: '2026-04-01T20:30:00Z' },
]
const songsRows = [
  { id: 'song-1', title: 'Dreams', artist: 'Fleetwood Mac' },
  { id: 'song-2', title: 'Maps', artist: 'Yeah Yeah Yeahs' },
]
const profileRows = [
  { id: 'singer-1', display_name: 'Avery', first_name: 'Avery', last_name: 'Lee' },
  { id: 'singer-2', display_name: 'Jordan', first_name: 'Jordan', last_name: 'Kim' },
  { id: 'user-1', display_name: 'Mike Jones', first_name: 'Mike', last_name: 'Jones', role: 'singer' },
]

const bandProfileEqMock = vi.fn()
const showEqMock = vi.fn()
const settingsEqMock = vi.fn()
const queueEqMock = vi.fn()
const songsEqMock = vi.fn()
const songsInMock = vi.fn()
const profilesInMock = vi.fn()

const singerDashboardViewMock = vi.fn((..._args: any[]) => null)

function makeMaybeSingle(data: unknown) {
  return async () => ({ data, error: null })
}

type AnySpy = (...args: any[]) => any

function makeQuery<T>(data: T, maybeSingleData?: unknown, spies?: {
  eq?: AnySpy
  in?: AnySpy
  order?: AnySpy
  limit?: AnySpy
}) {
  const chain: any = {
    data,
    select: vi.fn(() => chain),
    eq: vi.fn((...args: any[]) => {
      spies?.eq?.(...args)
      return chain
    }),
    in: vi.fn((...args: any[]) => {
      spies?.in?.(...args)
      return chain
    }),
    order: vi.fn((...args: any[]) => {
      spies?.order?.(...args)
      return chain
    }),
    limit: vi.fn((...args: any[]) => {
      spies?.limit?.(...args)
      return chain
    }),
    maybeSingle: vi.fn(maybeSingleData !== undefined ? makeMaybeSingle(maybeSingleData) : makeMaybeSingle(data instanceof Array ? data[0] ?? null : data)),
  }
  return chain
}

const createClientMock = vi.fn(() => ({
  auth: {
    getUser: authGetUserMock,
  },
  from(table: string) {
    switch (table) {
      case 'bands':
        return {
          select: vi.fn(() => ({ data: bandsData })),
        }
      case 'band_profiles':
        return {
          select: vi.fn(() => makeQuery(bandProfileRow, bandProfileRow, { eq: bandProfileEqMock })),
        }
      case 'events':
        return {
          select: vi.fn(() => makeQuery(showRow, showRow, { eq: showEqMock })),
        }
      case 'show_settings':
        return {
          select: vi.fn(() => makeQuery(settingsRow, settingsRow, { eq: settingsEqMock })),
        }
      case 'queue_items':
        return {
          select: vi.fn(() => makeQuery(queueRows, queueRows, { eq: queueEqMock })),
        }
      case 'songs':
        return {
          select: vi.fn(() => makeQuery(songsRows, songsRows, { eq: songsEqMock, in: songsInMock })),
        }
      case 'profiles':
        return {
          select: vi.fn(() => makeQuery(profileRows, profileRows[0], { in: profilesInMock })),
        }
      default:
        throw new Error(`Unexpected table: ${table}`)
    }
  },
}))

vi.mock('../../utils/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('../../components/singer-dashboard-view', () => ({
  SingerDashboardView: (props: unknown) => singerDashboardViewMock(props),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`)
  }),
}))

async function loadPage() {
  return await import('./page')
}

beforeEach(() => {
  authGetUserMock.mockReset()
  bandProfileEqMock.mockReset()
  showEqMock.mockReset()
  settingsEqMock.mockReset()
  queueEqMock.mockReset()
  songsEqMock.mockReset()
  songsInMock.mockReset()
  profilesInMock.mockReset()
  singerDashboardViewMock.mockReset()
  createClientMock.mockClear()
})

describe('SingerPage', () => {
  it('passes band profile and queue data into the dashboard using local mock data', async () => {
    authGetUserMock.mockResolvedValue({ data: { user: { id: 'singer-1' } } })

    const { default: SingerPage } = await loadPage()

    const element = await SingerPage({
      searchParams: Promise.resolve({ band: 'finding-north', show: 'show-1' }),
    })

    render(element)

    expect(bandProfileEqMock).toHaveBeenCalledWith('band_name', 'Finding North')
    expect(singerDashboardViewMock.mock.calls[0]?.[0]).toMatchObject({
      bandProfile: expect.objectContaining({
        bandName: 'Finding North',
        websiteUrl: 'https://findingnorth.example',
        customMessage: 'Request a song and tip the band.',
      }),
      singerName: 'Avery',
      currentRequest: { artist: 'Fleetwood Mac', title: 'Dreams' },
      liveQueueItems: expect.arrayContaining([
        expect.objectContaining({ artist: 'Fleetwood Mac', title: 'Dreams' }),
      ]),
      historyItems: expect.arrayContaining([
        expect.objectContaining({ artist: 'Yeah Yeah Yeahs', title: 'Maps' }),
      ]),
    })
  })
})
