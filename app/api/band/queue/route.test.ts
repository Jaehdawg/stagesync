import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const getLiveBandAccessContextMock = vi.fn()
const createServerClientMock = vi.fn(() => ({
  auth: { getUser: vi.fn() },
}))
const songsUpsertMock = vi.fn(() => ({ error: null }))
const queueInsertMock = vi.fn(() => ({ error: null }))
const eventsMaybeSingleMock = vi.fn(async () => ({
  data: { id: 'show-1', band_id: 'band-1', is_active: true, allow_signups: true },
  error: null,
}))
const queueMaybeSingleMock = vi.fn(async () => ({
  data: { position: 3 },
  error: null,
}))

function makeChain(result: () => Promise<{ data: any; error: any }>) {
  const chain: Record<string, any> = {
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    in: vi.fn(() => chain),
    maybeSingle: result,
  }
  return chain
}

const createServiceClientMock = vi.fn(() => ({
  from: vi.fn((table: string) => {
    if (table === 'events') {
      return {
        select: () => makeChain(eventsMaybeSingleMock),
      }
    }

    if (table === 'songs') {
      return {
        upsert: songsUpsertMock,
      }
    }

    if (table === 'queue_items') {
      return {
        select: () => makeChain(queueMaybeSingleMock),
        insert: queueInsertMock,
      }
    }

    return {}
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

function makeRequest(body: Record<string, string>) {
  return {
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    cookies: {
      getAll: () => [],
      setAll: vi.fn(),
    },
  } as unknown as NextRequest
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  createServerClientMock.mockClear()
  createServiceClientMock.mockClear()
  songsUpsertMock.mockClear()
  queueInsertMock.mockClear()
  eventsMaybeSingleMock.mockClear()
  queueMaybeSingleMock.mockClear()
})

describe('band queue api route', () => {
  it('adds a manual queue entry with an unlinked singer label', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', activeBandId: 'band-1' })

    const { POST } = await loadRoute()
    const response = await POST(
      makeRequest({
        singerName: 'Jordan',
        title: 'Dreams',
        artist: 'Fleetwood Mac',
        showId: 'show-1',
      })
    )

    expect(response.status).toBe(200)
    expect(songsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'dreams-fleetwood-mac',
        title: 'Dreams',
        artist: 'Fleetwood Mac',
        source_type: 'manual',
        band_id: 'band-1',
      }),
      { onConflict: 'band_id,id' }
    )
    expect(queueInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: 'show-1',
        band_id: 'band-1',
        performer_id: null,
        singer_name: 'Jordan',
        song_id: 'dreams-fleetwood-mac',
        status: 'queued',
        position: 4,
      })
    )
  })
})
