import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const authGetUserMock = vi.fn()
const profileMaybeSingleMock = vi.fn()
const showMaybeSingleMock = vi.fn()
const showSettingsMaybeSingleMock = vi.fn()
const currentSingerMaybeSingleMock = vi.fn()
const existingMaybeSingleMock = vi.fn()
const songUpsertMock = vi.fn()
const queueInsertMock = vi.fn()
const queueUpdateEqMock = vi.fn()

type QueryChain = {
  select: () => QueryChain
  eq: () => QueryChain
  in: () => QueryChain
  order: () => QueryChain
  limit: () => QueryChain
  maybeSingle: () => Promise<unknown>
}

function makeQueryChain(maybeSingle: () => Promise<unknown>): QueryChain {
  const chain: QueryChain = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle,
  }
  return chain
}

const createServerClientMock = vi.fn(() => ({
  auth: {
    getUser: authGetUserMock,
  },
  from: vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: profileMaybeSingleMock,
          }),
        }),
      }
    }

    return makeQueryChain(showMaybeSingleMock)
  }),
}))

const createServiceClientMock = vi.fn(() => {
  let queueSelectCalls = 0

  return {
    from: vi.fn((table: string) => {
      if (table === 'events') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: showMaybeSingleMock,
              }),
            }),
          }),
        }
      }

      if (table === 'show_settings') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: showSettingsMaybeSingleMock,
            }),
          }),
        }
      }

      if (table === 'queue_items') {
        return {
          select: () => makeQueryChain(async () => {
            queueSelectCalls += 1
            if (queueSelectCalls === 1) {
              return currentSingerMaybeSingleMock()
            }
            return existingMaybeSingleMock()
          }),
          update: () => ({ eq: queueUpdateEqMock }),
          insert: queueInsertMock,
        }
      }

      if (table === 'songs') {
        return {
          upsert: songUpsertMock,
        }
      }

      return {}
    }),
  }
})

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  authGetUserMock.mockReset()
  profileMaybeSingleMock.mockReset()
  showMaybeSingleMock.mockReset()
  showSettingsMaybeSingleMock.mockReset()
  currentSingerMaybeSingleMock.mockReset()
  existingMaybeSingleMock.mockReset()
  songUpsertMock.mockReset()
  queueInsertMock.mockReset()
  queueUpdateEqMock.mockReset()
  createServerClientMock.mockClear()
  createServiceClientMock.mockClear()
})

describe('queue route', () => {
  it('queues a singer song even when the profile role is missing but auth metadata says singer', async () => {
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', user_metadata: { role: 'singer' } } },
    })
    profileMaybeSingleMock.mockResolvedValue({ data: { role: null }, error: null })
    showMaybeSingleMock.mockResolvedValue({
      data: { id: 'show-1', band_id: 'band-1', is_active: true, allow_signups: true },
      error: null,
    })
    showSettingsMaybeSingleMock.mockResolvedValue({ data: { request_mode_enabled: false }, error: null })
    currentSingerMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    existingMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    songUpsertMock.mockResolvedValue({ error: null })
    queueInsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const request = {
      json: async () => ({
        title: 'My Song',
        artist: 'The Band',
        bandId: 'band-1',
        showId: 'show-1',
      }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest

    const response = await POST(request)
    const payload = (await response.json()) as { message?: string }

    expect(response.status).toBe(200)
    expect(payload.message).toBe('Song request added to the queue.')
    expect(songUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'my-song-the-band',
        title: 'My Song',
        artist: 'The Band',
        band_id: 'band-1',
        archived_at: null,
        source_type: 'uploaded',
        source_ref: null,
      }),
      { onConflict: 'band_id,id' }
    )
    expect(queueInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: 'show-1',
        band_id: 'band-1',
        performer_id: 'user-1',
        song_id: 'my-song-the-band',
        status: 'queued',
        position: 1,
      })
    )
  })

  it('preserves tidal catalog source metadata on the queued song record', async () => {
    authGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', user_metadata: { role: 'singer' } } },
    })
    profileMaybeSingleMock.mockResolvedValue({ data: { role: null }, error: null })
    showMaybeSingleMock.mockResolvedValue({
      data: { id: 'show-1', band_id: 'band-1', is_active: true, allow_signups: true },
      error: null,
    })
    showSettingsMaybeSingleMock.mockResolvedValue({ data: { request_mode_enabled: false }, error: null })
    currentSingerMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    existingMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    songUpsertMock.mockResolvedValue({ error: null })
    queueInsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const request = {
      json: async () => ({
        title: 'Catalog Song',
        artist: 'Artist',
        bandId: 'band-1',
        showId: 'show-1',
        sourceType: 'tidal_catalog',
        sourceRef: 'catalog-track-1',
      }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(songUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'catalog-song-artist',
        title: 'Catalog Song',
        artist: 'Artist',
        source_type: 'tidal_catalog',
        source_ref: 'catalog-track-1',
      }),
      { onConflict: 'band_id,id' }
    )
  })

  it('marks queue items as requested when the show is in request mode', async () => {
    authGetUserMock.mockResolvedValue({ data: { user: { id: 'user-1', user_metadata: { role: 'singer' } } } })
    profileMaybeSingleMock.mockResolvedValue({ data: { role: 'singer' }, error: null })
    showMaybeSingleMock.mockResolvedValue({ data: { id: 'show-1', band_id: 'band-1', is_active: true, allow_signups: true }, error: null })
    showSettingsMaybeSingleMock.mockResolvedValue({ data: { request_mode_enabled: true }, error: null })
    currentSingerMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    existingMaybeSingleMock.mockResolvedValue({ data: null, error: null })
    songUpsertMock.mockResolvedValue({ error: null })
    queueInsertMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const request = {
      json: async () => ({
        title: 'My Song',
        artist: 'The Band',
        bandId: 'band-1',
        showId: 'show-1',
      }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(queueInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'requested',
      })
    )
  })
})
