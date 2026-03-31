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

  it('returns empty results when no token is configured', async () => {
    const result = await searchTidalTracks('Dreams')
    expect(result).toEqual([])
  })
})
