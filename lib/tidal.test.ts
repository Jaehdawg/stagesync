import { describe, expect, it } from 'vitest'
import { extractTidalTracks, searchTidalTracks } from './tidal'

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
        data: [
          {
            type: 'items',
            id: 'playlist-item-1',
            relationships: {
              track: {
                data: { type: 'tracks', id: 'track-1' },
              },
            },
          },
        ],
        included: [
          {
            type: 'tracks',
            id: 'track-1',
            attributes: {
              title: 'Dreams',
              albumTitle: 'Rumours',
            },
            relationships: {
              artists: {
                data: [{ type: 'artists', id: 'artist-1' }],
              },
            },
          },
          {
            type: 'artists',
            id: 'artist-1',
            attributes: {
              name: 'Fleetwood Mac',
            },
          },
        ],
      })
    ).toEqual([
      { id: 'track-1', title: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours' },
    ])
  })

  it('returns empty results when no token is configured', async () => {
    const result = await searchTidalTracks('Dreams')
    expect(result).toEqual([])
  })
})
