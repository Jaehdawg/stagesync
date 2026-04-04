import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

type QueryResponse = {
  data: { id: string; title: string; artist: string }[]
  error: null
}

type Builder = {
  eq: () => Builder
  is: () => Builder
  order: () => Builder
  limit: () => Builder
  or: () => Builder
  then: <TResult1 = QueryResponse, TResult2 = never>(
    onFulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) => Promise<TResult1 | TResult2>
}

const createServiceClientMock = vi.fn(() => {
  const response: QueryResponse = { data: [{ id: 'song-1', title: 'My Song', artist: 'The Band' }], error: null }

  const builder: Builder = {
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    or: vi.fn(() => builder),
    then: (onFulfilled, onRejected) => Promise.resolve(response).then(onFulfilled, onRejected),
  }

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => builder),
    })),
  }
})

const getBandTidalCredentialsMock = vi.fn()
const searchTidalTracksMock = vi.fn()

vi.mock('../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('../../../../lib/band-tidal', () => ({
  getBandTidalCredentials: getBandTidalCredentialsMock,
}))

vi.mock('../../../../lib/tidal', () => ({
  searchTidalTracks: searchTidalTracksMock,
}))

async function loadRoute() {
  return await import('./route')
}

function makeRequest(url: string) {
  return new NextRequest(url)
}

beforeEach(() => {
  createServiceClientMock.mockClear()
  getBandTidalCredentialsMock.mockClear()
  searchTidalTracksMock.mockClear()
})

describe('songs search api route', () => {
  it('returns catalog search results with a next cursor', async () => {
    getBandTidalCredentialsMock.mockResolvedValue({ clientId: 'client', clientSecret: 'secret' })
    searchTidalTracksMock.mockResolvedValue({ tracks: [{ id: 't1', title: 'Catalog Song', artist: 'Artist' }], nextCursor: 'cursor-2' })

    const { GET } = await loadRoute()
    const response = await GET(makeRequest('https://example.com/api/songs/search?bandId=band-1&sourceMode=tidal_catalog&query=hello'))
    const payload = (await response.json()) as { songs: unknown[]; nextCursor: string | null }

    expect(response.status).toBe(200)
    expect(getBandTidalCredentialsMock).toHaveBeenCalled()
    expect(searchTidalTracksMock).toHaveBeenCalledWith('hello', expect.objectContaining({ limit: 30, cursor: null }))
    expect(payload.songs).toHaveLength(1)
    expect(payload.nextCursor).toBe('cursor-2')
  })

  it('returns stored songs for uploaded mode', async () => {
    const { GET } = await loadRoute()
    const response = await GET(makeRequest('https://example.com/api/songs/search?bandId=band-1&sourceMode=uploaded&query=my'))
    const payload = (await response.json()) as { songs: unknown[] }

    expect(response.status).toBe(200)
    expect(payload.songs).toHaveLength(1)
  })
})
