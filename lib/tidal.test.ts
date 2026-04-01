import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractTidalTracks, fetchTidalPlaylistTracks, searchTidalTracks } from './tidal'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('tidal helpers', () => {
  it('extracts track records from nested payloads', () => {
    expect(
      extractTidalTracks({
        tracks: [
          { id: '1', title: 'Dreams', artist: { name: 'Fleetwood Mac' }, album: { title: 'Rumours' } },
        ],
      })
    ).toEqual([{ id: '1', title: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours' }])
  })

  it('unwraps playlist relationship items into playable tracks', () => {
    expect(
      extractTidalTracks({
        items: [
          {
            item: {
              id: 64186726,
              title: 'Dreams',
              duration: 300,
              artist: { name: 'Fleetwood Mac' },
              album: { title: 'Rumours' },
            },
          },
        ],
      })
    ).toEqual([
      { id: '64186726', title: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours', duration: 300 },
    ])
  })

  it('fetches playlist tracks and hydrates artist names through the Tidal API flow', async () => {
    const originalClientId = process.env.TIDAL_CLIENT_ID
    const originalClientSecret = process.env.TIDAL_CLIENT_SECRET
    process.env.TIDAL_CLIENT_ID = 'client-id'
    process.env.TIDAL_CLIENT_SECRET = 'client-secret'

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === 'https://auth.tidal.com/v1/oauth2/token') {
        expect(init).toMatchObject({
          method: 'POST',
          headers: expect.objectContaining({
            authorization: expect.stringContaining('Basic '),
            'content-type': 'application/x-www-form-urlencoded',
          }),
        })

        return {
          ok: true,
          json: async () => ({ access_token: 'tidal-bearer-token' }),
        } as Response
      }

      if (url.includes('/playlists/abc123/relationships/items')) {
        expect(url).toContain('https://openapi.tidal.com/v2/playlists/abc123/relationships/items')
        expect(url).toContain('limit=200')
        expect(init?.headers).toMatchObject({
          accept: 'application/vnd.api+json',
          authorization: 'Bearer tidal-bearer-token',
        })

        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: '64186726',
                type: 'tracks',
                meta: { itemId: 'abc-track-item' },
              },
            ],
          }),
        } as Response
      }

      if (url.includes('/tracks/64186726/relationships/artists')) {
        expect(url).toContain('https://openapi.tidal.com/v2/tracks/64186726/relationships/artists')
        expect(init?.headers).toMatchObject({
          accept: 'application/vnd.api+json',
          authorization: 'Bearer tidal-bearer-token',
        })

        return {
          ok: true,
          json: async () => ({
            data: [{ id: '25055', type: 'artists' }],
          }),
        } as Response
      }

      if (url.includes('/tracks/64186726?')) {
        expect(url).toContain('https://openapi.tidal.com/v2/tracks/64186726')
        expect(init?.headers).toMatchObject({
          accept: 'application/vnd.api+json',
          authorization: 'Bearer tidal-bearer-token',
        })

        return {
          ok: true,
          json: async () => ({
            data: {
              id: '64186726',
              type: 'tracks',
              attributes: {
                title: 'Dreams',
                duration: 'PT5M',
              },
              relationships: {
                artists: {
                  data: [{ id: '25055', type: 'artists' }],
                },
              },
            },
          }),
        } as Response
      }

      if (url.includes('/artists/25055?')) {
        expect(url).toContain('https://openapi.tidal.com/v2/artists/25055')
        expect(init?.headers).toMatchObject({
          accept: 'application/vnd.api+json',
          authorization: 'Bearer tidal-bearer-token',
        })

        return {
          ok: true,
          json: async () => ({
            data: {
              id: '25055',
              type: 'artists',
              attributes: { name: 'Counting Crows' },
            },
          }),
        } as Response
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTidalPlaylistTracks('https://tidal.com/playlist/abc123')).resolves.toEqual([
      { id: '64186726', title: 'Dreams', artist: 'Counting Crows', album: null, duration: 300 },
    ])

    expect(fetchMock).toHaveBeenCalledTimes(5)

    if (originalClientId === undefined) {
      delete process.env.TIDAL_CLIENT_ID
    } else {
      process.env.TIDAL_CLIENT_ID = originalClientId
    }

    if (originalClientSecret === undefined) {
      delete process.env.TIDAL_CLIENT_SECRET
    } else {
      process.env.TIDAL_CLIENT_SECRET = originalClientSecret
    }
  })

  it('returns empty results when no token is configured', async () => {
    const result = await searchTidalTracks('Dreams')
    expect(result).toEqual([])
  })
})
