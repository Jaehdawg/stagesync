import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

type QueryResponse = {
  data: { id: string; title: string; artist: string }[]
  error: null
}

type Builder = {
  eq: (column: string, value: string) => Builder
  is: () => Builder
  order: () => Builder
  limit: () => Builder
  or: () => Builder
  then: <TResult1 = QueryResponse, TResult2 = never>(
    onFulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) => Promise<TResult1 | TResult2>
}

const orMock = vi.fn()

const createServiceClientMock = vi.fn(() => {
  const response: QueryResponse = { data: [{ id: 'song-1', title: 'My Song', artist: 'The Band' }], error: null }
  const songsEqMock = vi.fn(() => builder)

  const builder: Builder = {
    eq: songsEqMock,
    is: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    or: orMock.mockImplementation(() => builder),
    then: (onFulfilled, onRejected) => Promise.resolve(response).then(onFulfilled, onRejected),
  }

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => builder),
    })),
    songsEqMock,
  }
})

const getBandTidalCredentialsMock = vi.fn()
const getTidalAccessTokenMock = vi.fn()
const searchTidalTracksMock = vi.fn()

vi.mock('../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('../../../../lib/band-tidal', () => ({
  getBandTidalCredentials: getBandTidalCredentialsMock,
}))

vi.mock('../../../../lib/tidal', () => ({
  getTidalAccessToken: getTidalAccessTokenMock,
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
  orMock.mockClear()
  getBandTidalCredentialsMock.mockClear()
  getTidalAccessTokenMock.mockClear()
  searchTidalTracksMock.mockClear()
})

describe('songs search api route', () => {
  it('returns catalog search results with a next cursor', async () => {
    getBandTidalCredentialsMock.mockResolvedValue({ clientId: 'client', clientSecret: 'secret' })
    getTidalAccessTokenMock.mockResolvedValue('tidal-token')
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

  it('filters playlist mode to imported playlist songs', async () => {
    const { GET } = await loadRoute()
    const response = await GET(makeRequest('https://example.com/api/songs/search?bandId=band-1&sourceMode=tidal_playlist&query=my'))

    expect(response.status).toBe(200)
    const client = createServiceClientMock.mock.results[0]?.value as { songsEqMock?: ReturnType<typeof vi.fn> }
    expect(client.songsEqMock).toHaveBeenCalledWith('source_type', 'tidal_playlist')
  })

  it('sanitizes search queries before building the database filter', async () => {
    const { GET } = await loadRoute()
    const response = await GET(makeRequest('https://example.com/api/songs/search?bandId=band-1&sourceMode=uploaded&query=%28my%2Csong%29'))

    expect(response.status).toBe(200)
    expect(orMock).toHaveBeenCalledWith('title.ilike.%my song%,artist.ilike.%my song%')
  })

  it('returns a retryable error when tidal credentials are missing or invalid', async () => {
    getBandTidalCredentialsMock.mockResolvedValue(null)
    getTidalAccessTokenMock.mockResolvedValue(null)

    const { GET } = await loadRoute()
    const response = await GET(makeRequest('https://example.com/api/songs/search?bandId=band-1&sourceMode=tidal_catalog&query=hello'))
    const payload = (await response.json()) as { message?: string }

    expect(response.status).toBe(503)
    expect(payload.message).toContain('Tidal Catalog is unavailable')
    expect(searchTidalTracksMock).not.toHaveBeenCalled()
  })

  it('returns a retryable error when tidal auth cannot exchange a token', async () => {
    getBandTidalCredentialsMock.mockResolvedValue({ clientId: 'client', clientSecret: 'secret' })
    getTidalAccessTokenMock.mockResolvedValue(null)

    const { GET } = await loadRoute()
    const response = await GET(makeRequest('https://example.com/api/songs/search?bandId=band-1&sourceMode=tidal_catalog&query=hello'))
    const payload = (await response.json()) as { message?: string }

    expect(response.status).toBe(503)
    expect(payload.message).toContain('Tidal Catalog is unavailable')
    expect(searchTidalTracksMock).not.toHaveBeenCalled()
  })
})
