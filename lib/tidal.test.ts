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
    const originalBrowserToken = process.env.TIDAL_BROWSER_TOKEN
    const originalClientId = process.env.TIDAL_CLIENT_ID
    const originalClientSecret = process.env.TIDAL_CLIENT_SECRET
    delete process.env.TIDAL_BROWSER_TOKEN
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

    if (originalBrowserToken === undefined) {
      delete process.env.TIDAL_BROWSER_TOKEN
    } else {
      process.env.TIDAL_BROWSER_TOKEN = originalBrowserToken
    }

    if (originalClientSecret === undefined) {
      delete process.env.TIDAL_CLIENT_SECRET
    } else {
      process.env.TIDAL_CLIENT_SECRET = originalClientSecret
    }
  })

  it('fetches private playlist tracks through the server-side API flow with pagination', async () => {
    const originalClientId = process.env.TIDAL_CLIENT_ID
    const originalClientSecret = process.env.TIDAL_CLIENT_SECRET
    delete process.env.TIDAL_BROWSER_TOKEN
    process.env.TIDAL_CLIENT_ID = 'client-id'
    process.env.TIDAL_CLIENT_SECRET = 'client-secret'

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === 'https://auth.tidal.com/v1/oauth2/token') {
        return {
          ok: true,
          json: async () => ({ access_token: 'tidal-bearer-token' }),
        } as Response
      }

      if (url.includes('/playlists/abc123/relationships/items')) {
        expect(url).toContain('https://openapi.tidal.com/v2/playlists/abc123/relationships/items')
        expect(init?.headers).toMatchObject({
          accept: 'application/vnd.api+json',
          authorization: 'Bearer tidal-bearer-token',
        })

        if (url.includes('offset=0')) {
          return {
            ok: true,
            json: async () => ({
              totalNumberOfItems: 2,
              data: [{ id: '64186726', type: 'tracks' }],
              links: { next: 'https://openapi.tidal.com/v2/playlists/abc123/relationships/items?offset=1&limit=1&countryCode=US' },
            }),
          } as Response
        }

        return {
          ok: true,
          json: async () => ({
            totalNumberOfItems: 2,
            data: [{ id: '12345', type: 'tracks' }],
          }),
        } as Response
      }

      if (url.includes('/tracks/64186726/relationships/artists')) {
        return {
          ok: true,
          json: async () => ({ data: [{ id: '25055', type: 'artists' }] }),
        } as Response
      }

      if (url.includes('/tracks/12345/relationships/artists')) {
        return {
          ok: true,
          json: async () => ({ data: [{ id: '33236', type: 'artists' }] }),
        } as Response
      }

      if (url.includes('/tracks/64186726?')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: '64186726',
              type: 'tracks',
              attributes: { title: 'Dreams', duration: 'PT5M' },
            },
          }),
        } as Response
      }

      if (url.includes('/tracks/12345?')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: '12345',
              type: 'tracks',
              attributes: { title: 'Flowers', duration: 'PT3M20S' },
            },
          }),
        } as Response
      }

      if (url.includes('/artists/25055?')) {
        return {
          ok: true,
          json: async () => ({ data: { id: '25055', type: 'artists', attributes: { name: 'Counting Crows' } } }),
        } as Response
      }

      if (url.includes('/artists/33236?')) {
        return {
          ok: true,
          json: async () => ({ data: { id: '33236', type: 'artists', attributes: { name: 'Miley Cyrus' } } }),
        } as Response
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTidalPlaylistTracks('https://tidal.com/browse/playlist/abc123', { limit: 1 })).resolves.toEqual([
      { id: '64186726', title: 'Dreams', artist: 'Counting Crows', album: null, duration: 300 },
      { id: '12345', title: 'Flowers', artist: 'Miley Cyrus', album: null, duration: 200 },
    ])

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

  it('walks the playlist API end to end with pagination, track titles, artist names, and durations', async () => {
    const originalClientId = process.env.TIDAL_CLIENT_ID
    const originalClientSecret = process.env.TIDAL_CLIENT_SECRET
    delete process.env.TIDAL_BROWSER_TOKEN
    process.env.TIDAL_CLIENT_ID = 'client-id'
    process.env.TIDAL_CLIENT_SECRET = 'client-secret'

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === 'https://auth.tidal.com/v1/oauth2/token') {
        return {
          ok: true,
          json: async () => ({ access_token: 'tidal-bearer-token' }),
        } as Response
      }

      if (url.includes('/playlists/abc123/relationships/items')) {
        expect(init?.headers).toMatchObject({
          accept: 'application/vnd.api+json',
          authorization: 'Bearer tidal-bearer-token',
        })

        if (url.includes('offset=0')) {
          return {
            ok: true,
            json: async () => ({
              totalNumberOfItems: 3,
              data: [
                { id: '64186726', type: 'tracks' },
                { id: '136685782', type: 'tracks' },
              ],
              links: { next: '/playlists/abc123/relationships/items?offset=2&limit=2&countryCode=US' },
            }),
          } as Response
        }

        return {
          ok: true,
          json: async () => ({
            totalNumberOfItems: 3,
            data: [{ id: '128550', type: 'tracks' }],
          }),
        } as Response
      }

      if (url.includes('/tracks/64186726?')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: '64186726',
              type: 'tracks',
              attributes: { title: 'Dreams', duration: 'PT5M' },
            },
          }),
        } as Response
      }

      if (url.includes('/tracks/136685782?')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: '136685782',
              type: 'tracks',
              attributes: { title: 'Bad Decisions', duration: 'PT4M53S' },
            },
          }),
        } as Response
      }

      if (url.includes('/tracks/128550?')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: '128550',
              type: 'tracks',
              attributes: { title: 'Fix You', duration: 'PT4M56S' },
            },
          }),
        } as Response
      }

      if (url.includes('/tracks/64186726/relationships/artists')) {
        return {
          ok: true,
          json: async () => ({ data: [{ id: '25055', type: 'artists' }] }),
        } as Response
      }

      if (url.includes('/tracks/136685782/relationships/artists')) {
        return {
          ok: true,
          json: async () => ({ data: [{ id: '99999', type: 'artists' }] }),
        } as Response
      }

      if (url.includes('/tracks/128550/relationships/artists')) {
        return {
          ok: true,
          json: async () => ({ data: [{ id: '13866', type: 'artists' }] }),
        } as Response
      }

      if (url.includes('/artists/25055?')) {
        return {
          ok: true,
          json: async () => ({ data: { id: '25055', type: 'artists', attributes: { name: 'Counting Crows' } } }),
        } as Response
      }

      if (url.includes('/artists/99999?')) {
        return {
          ok: true,
          json: async () => ({ data: { id: '99999', type: 'artists', attributes: { name: 'The Strokes' } } }),
        } as Response
      }

      if (url.includes('/artists/13866?')) {
        return {
          ok: true,
          json: async () => ({ data: { id: '13866', type: 'artists', attributes: { name: 'Coldplay' } } }),
        } as Response
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTidalPlaylistTracks('https://tidal.com/playlist/abc123', { limit: 2 })).resolves.toEqual([
      { id: '64186726', title: 'Dreams', artist: 'Counting Crows', album: null, duration: 300 },
      { id: '136685782', title: 'Bad Decisions', artist: 'The Strokes', album: null, duration: 293 },
      { id: '128550', title: 'Fix You', artist: 'Coldplay', album: null, duration: 296 },
    ])

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

  it('retries rate-limited track fetches and still returns the resolved song', async () => {
    const originalClientId = process.env.TIDAL_CLIENT_ID
    const originalClientSecret = process.env.TIDAL_CLIENT_SECRET
    delete process.env.TIDAL_BROWSER_TOKEN
    process.env.TIDAL_CLIENT_ID = 'client-id'
    process.env.TIDAL_CLIENT_SECRET = 'client-secret'

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === 'https://auth.tidal.com/v1/oauth2/token') {
        return {
          ok: true,
          json: async () => ({ access_token: 'tidal-bearer-token' }),
        } as Response
      }

      if (url.includes('/playlists/abc123/relationships/items')) {
        return {
          ok: true,
          json: async () => ({
            totalNumberOfItems: 1,
            data: [{ id: '136685782', type: 'tracks' }],
          }),
        } as Response
      }

      if (url.includes('/tracks/136685782?')) {
        const attempts = fetchMock.mock.calls.filter(([calledUrl]) => String(calledUrl).includes('/tracks/136685782?')).length
        if (attempts === 1) {
          return {
            ok: false,
            status: 429,
            headers: new Headers({ 'retry-after': '0' }),
            json: async () => ({}),
            text: async () => '',
          } as Response
        }

        return {
          ok: true,
          json: async () => ({
            data: {
              id: '136685782',
              type: 'tracks',
              attributes: { title: 'Bad Decisions', duration: 'PT4M53S' },
            },
          }),
        } as Response
      }

      if (url.includes('/tracks/136685782/relationships/artists')) {
        return {
          ok: true,
          json: async () => ({ data: [{ id: '29037', type: 'artists' }] }),
        } as Response
      }

      if (url.includes('/artists/29037?')) {
        return {
          ok: true,
          json: async () => ({ data: { id: '29037', type: 'artists', attributes: { name: 'The Strokes' } } }),
        } as Response
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTidalPlaylistTracks('https://tidal.com/playlist/abc123', { limit: 1 })).resolves.toEqual([
      { id: '136685782', title: 'Bad Decisions', artist: 'The Strokes', album: null, duration: 293 },
    ])

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
