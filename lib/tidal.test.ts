import { describe, expect, it } from 'vitest'
import { extractTidalTracks, fetchTidalPlaylistTracks, searchTidalTracks } from './tidal'

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

  it('fetches private playlist tracks through the browser token path when configured', async () => {
    const originalToken = process.env.TIDAL_BROWSER_TOKEN
    process.env.TIDAL_BROWSER_TOKEN = 'txNoH4kkV41MfH25'

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        limit: 1,
        offset: 0,
        totalNumberOfItems: 1,
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
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTidalPlaylistTracks('https://tidal.com/playlist/abc123')).resolves.toEqual([
      { id: '64186726', title: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours', duration: 300 },
    ])

    expect(fetchMock).toHaveBeenCalledOnce()
    const [input, init] = fetchMock.mock.calls[0]
    expect(String(input)).toContain('https://listen.tidal.com/v1/playlists/abc123/items')
    expect(String(input)).toContain('offset=0')
    expect(String(input)).toContain('deviceType=BROWSER')
    expect(init?.headers).toMatchObject({
      accept: 'application/json',
      'x-tidal-token': 'txNoH4kkV41MfH25',
      referer: 'https://tidal.com/playlist/abc123',
    })

    if (originalToken === undefined) {
      delete process.env.TIDAL_BROWSER_TOKEN
    } else {
      process.env.TIDAL_BROWSER_TOKEN = originalToken
    }
  })

  it('returns empty results when no token is configured', async () => {
    const result = await searchTidalTracks('Dreams')
    expect(result).toEqual([])
  })
})
