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
        relationships: {
          items: {
            data: [
              {
                id: '64186726',
                type: 'tracks',
                attributes: {
                  title: 'Dancing with Myself (2001 Remaster)',
                  duration: 'PT3M47S',
                },
                relationships: {
                  artists: {
                    data: [{ id: '10283', type: 'artists' }],
                  },
                },
              },
            ],
          },
        },
        included: [
          { id: '10283', type: 'artists', attributes: { name: 'Billy Idol' } },
        ],
      })
    ).toEqual([
      {
        id: '64186726',
        title: 'Dancing with Myself (2001 Remaster)',
        artist: 'Billy Idol',
        album: null,
        duration: 227,
      },
    ])
  })

  it('fetches the f1abe534 playlist end to end through the relationships/items cursor flow', async () => {
    const originalClientId = process.env.TIDAL_CLIENT_ID
    const originalClientSecret = process.env.TIDAL_CLIENT_SECRET
    delete process.env.TIDAL_BROWSER_TOKEN
    process.env.TIDAL_CLIENT_ID = 'client-id'
    process.env.TIDAL_CLIENT_SECRET = 'client-secret'

    const playlistId = 'f1abe534-82ea-4db9-8c21-b60eace5e30a'

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

      if (url.includes(`/playlists/${playlistId}/relationships/items`)) {
        expect(init?.headers).toMatchObject({
          accept: 'application/vnd.api+json',
          authorization: 'Bearer tidal-bearer-token',
        })

        if (!url.includes('page%5Bcursor%5D=')) {
          return {
            ok: true,
            json: async () => ({
              data: [
                { id: '136685782', type: 'tracks' },
                { id: '1906289', type: 'tracks' },
              ],
              included: [
                {
                  id: '136685782',
                  type: 'tracks',
                  attributes: { title: 'Bad Decisions', duration: 'PT4M53S' },
                  relationships: { artists: { data: [{ id: '29037', type: 'artists' }] } },
                },
                {
                  id: '1906289',
                  type: 'tracks',
                  attributes: { title: 'Revelry', duration: 'PT3M22S' },
                  relationships: { artists: { data: [{ id: '39438', type: 'artists' }] } },
                },
                { id: '29037', type: 'artists', attributes: { name: 'The Strokes' } },
                { id: '39438', type: 'artists', attributes: { name: 'Kings Of Leon' } },
              ],
              links: {
                next: `/playlists/${playlistId}/relationships/items?include=items.artists&page%5Bcursor%5D=next-cursor-1`,
              },
            }),
          } as Response
        }

        return {
          ok: true,
          json: async () => ({
            data: [{ id: '128550', type: 'tracks' }],
            included: [
              {
                id: '128550',
                type: 'tracks',
                attributes: { title: 'Fix You', duration: 'PT4M56S' },
                relationships: { artists: { data: [{ id: '8812', type: 'artists' }] } },
              },
              { id: '8812', type: 'artists', attributes: { name: 'Coldplay' } },
            ],
            links: {
              next: null,
            },
          }),
        } as Response
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTidalPlaylistTracks(`https://tidal.com/playlist/${playlistId}`, { limit: 20 })).resolves.toEqual([
      { id: '136685782', title: 'Bad Decisions', artist: 'The Strokes', album: null, duration: 293 },
      { id: '1906289', title: 'Revelry', artist: 'Kings Of Leon', album: null, duration: 202 },
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

  it('retries a rate-limited playlist cursor fetch and still resolves the track list', async () => {
    const originalClientId = process.env.TIDAL_CLIENT_ID
    const originalClientSecret = process.env.TIDAL_CLIENT_SECRET
    delete process.env.TIDAL_BROWSER_TOKEN
    process.env.TIDAL_CLIENT_ID = 'client-id'
    process.env.TIDAL_CLIENT_SECRET = 'client-secret'

    const playlistId = 'f1abe534-82ea-4db9-8c21-b60eace5e30a'
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === 'https://auth.tidal.com/v1/oauth2/token') {
        return {
          ok: true,
          json: async () => ({ access_token: 'tidal-bearer-token' }),
        } as Response
      }

      if (url.includes(`/playlists/${playlistId}/relationships/items`)) {
        const attempts = fetchMock.mock.calls.filter(([calledUrl]) => String(calledUrl).includes(`/playlists/${playlistId}/relationships/items`)).length
        if (attempts === 1) {
          return {
            ok: false,
            status: 429,
            headers: new Headers({ 'retry-after': '0' }),
            json: async () => ({}),
            text: async () => '',
          } as Response
        }

        expect(init?.headers).toMatchObject({
          accept: 'application/vnd.api+json',
          authorization: 'Bearer tidal-bearer-token',
        })

        return {
          ok: true,
          json: async () => ({
            data: [{ id: '136685782', type: 'tracks' }],
            included: [
              {
                id: '136685782',
                type: 'tracks',
                attributes: { title: 'Bad Decisions', duration: 'PT4M53S' },
                relationships: { artists: { data: [{ id: '29037', type: 'artists' }] } },
              },
              { id: '29037', type: 'artists', attributes: { name: 'The Strokes' } },
            ],
            links: { next: null },
          }),
        } as Response
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTidalPlaylistTracks(`https://tidal.com/playlist/${playlistId}`, { limit: 20 })).resolves.toEqual([
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
