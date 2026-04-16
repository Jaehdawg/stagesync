import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const getLiveBandAccessContextMock = vi.fn()
const eventInsertMock = vi.fn()
const eventSelectEqMock = vi.fn()
const eventUpdateEqMock = vi.fn()
const showSettingsUpsertMock = vi.fn()
const showSettingsSelectEqMock = vi.fn()

const createServerClientMock = vi.fn(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
  })),
}))

const createServiceClientMock = vi.fn(() => ({
  from: vi.fn((table: string) => {
    if (table === 'events') {
      return {
        insert: eventInsertMock,
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: eventSelectEqMock,
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: eventUpdateEqMock,
          })),
        })),
      }
    }

    if (table === 'test_show_settings' || table === 'show_settings') {
      return {
        upsert: showSettingsUpsertMock,
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: showSettingsSelectEqMock,
          })),
        })),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@/utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('@/lib/test-session', () => ({
  getTestSession: getTestSessionMock,
}))

vi.mock('@/lib/band-access', () => ({
  getLiveBandAccessContext: getLiveBandAccessContextMock,
}))

async function loadRoute() {
  return await import('./route')
}

function makeRequest(fields: Record<string, string>) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value)
  }

  return {
    formData: async () => form,
    cookies: {
      getAll: () => [],
      set: vi.fn(),
    },
    headers: new Headers(),
    url: 'https://example.com/api/shows',
  } as unknown as NextRequest
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  createServerClientMock.mockClear()
  createServiceClientMock.mockClear()
  eventInsertMock.mockReset()
  eventSelectEqMock.mockReset()
  eventUpdateEqMock.mockReset()
  showSettingsUpsertMock.mockReset()
  showSettingsSelectEqMock.mockReset()
})

describe('shows api route', () => {
  it('saves tidal catalog mode when creating a test show', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', activeBandId: 'band-1' })
    eventInsertMock.mockResolvedValue({ error: null })
    eventSelectEqMock.mockResolvedValue({ data: { id: 'event-1' }, error: null })
    showSettingsUpsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const response = await POST(makeRequest({
      action: 'create',
      name: 'Saturday Night',
      description: 'Live karaoke show',
      showDurationMinutes: '90',
      signupBufferMinutes: '2',
      songSourceMode: 'tidal_catalog',
    }))

    expect(response.status).toBe(307)
    expect(showSettingsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        song_source_mode: 'tidal_catalog',
        show_duration_minutes: 90,
        signup_buffer_minutes: 2,
      }),
      { onConflict: 'band_id' }
    )
  })

  it('saves tidal playlist mode with the playlist url when creating a test show', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', activeBandId: 'band-1' })
    eventInsertMock.mockResolvedValue({ error: null })
    eventSelectEqMock.mockResolvedValue({ data: { id: 'event-1' }, error: null })
    showSettingsUpsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const response = await POST(makeRequest({
      action: 'create',
      name: 'Saturday Night',
      description: 'Live karaoke show',
      showDurationMinutes: '90',
      signupBufferMinutes: '2',
      songSourceMode: 'tidal_playlist',
      tidalPlaylistUrl: 'https://tidal.com/playlist/abc123',
    }))

    expect(response.status).toBe(307)
    expect(showSettingsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        song_source_mode: 'tidal_playlist',
        tidal_playlist_url: 'https://tidal.com/playlist/abc123',
      }),
      { onConflict: 'band_id' }
    )
  })

  it('keeps tidal catalog mode when updating test show settings', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', activeBandId: 'band-1' })
    showSettingsSelectEqMock.mockResolvedValue({ data: { tidal_playlist_url: null }, error: null })
    showSettingsUpsertMock.mockResolvedValue({ error: null })
    eventUpdateEqMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const response = await POST(makeRequest({
      action: 'settings',
      eventId: 'event-1',
      name: 'Saturday Night',
      description: 'Live karaoke show',
      showDurationMinutes: '120',
      signupBufferMinutes: '1',
      songSourceMode: 'tidal_catalog',
    }))

    expect(response.status).toBe(307)
    expect(showSettingsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        song_source_mode: 'tidal_catalog',
        show_duration_minutes: 120,
        signup_buffer_minutes: 1,
      }),
      { onConflict: 'band_id' }
    )
  })

  it('keeps the playlist url when updating tidal playlist mode', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', activeBandId: 'band-1' })
    showSettingsSelectEqMock.mockResolvedValue({ data: { tidal_playlist_url: 'https://tidal.com/playlist/old' }, error: null })
    showSettingsUpsertMock.mockResolvedValue({ error: null })
    eventUpdateEqMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const response = await POST(makeRequest({
      action: 'settings',
      eventId: 'event-1',
      name: 'Saturday Night',
      description: 'Live karaoke show',
      showDurationMinutes: '120',
      signupBufferMinutes: '1',
      songSourceMode: 'tidal_playlist',
      tidalPlaylistUrl: 'https://tidal.com/playlist/new',
    }))

    expect(response.status).toBe(307)
    expect(showSettingsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        song_source_mode: 'tidal_playlist',
        tidal_playlist_url: 'https://tidal.com/playlist/new',
      }),
      { onConflict: 'band_id' }
    )
  })

  it('persists song request mode and request source when saving show settings', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', activeBandId: 'band-1' })
    showSettingsSelectEqMock.mockResolvedValue({ data: { tidal_playlist_url: null }, error: null })
    showSettingsUpsertMock.mockResolvedValue({ error: null })
    eventUpdateEqMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const response = await POST(makeRequest({
      action: 'settings',
      eventId: 'event-1',
      name: 'Saturday Night',
      description: 'Live karaoke show',
      showDurationMinutes: '120',
      signupBufferMinutes: '1',
      songSourceMode: 'set_list',
      requestModeEnabled: 'true',
      requestSourceMode: 'uploaded',
    }))

    expect(response.status).toBe(307)
    expect(showSettingsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        request_mode_enabled: true,
        request_source_mode: 'uploaded',
      }),
      { onConflict: 'band_id' }
    )
  })
})
