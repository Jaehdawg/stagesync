import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildGoogleSheetExportUrl, buildTidalPlaylistSongs, dedupeSongImportRecords, parseSongsCsv } from './song-library'
import { fetchTidalPlaylistTracks } from './tidal'

vi.mock('./tidal', () => ({
  fetchTidalPlaylistTracks: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('song library helpers', () => {
  it('parses csv song imports with canonical ids and durations', () => {
    const songs = parseSongsCsv('Artist,Song Title,Duration\nFleetwood Mac,Dreams,5:00\nCounting Crows,Mr. Jones,272')

    expect(songs).toEqual([
      {
        id: 'dreams-fleetwood-mac',
        title: 'Dreams',
        artist: 'Fleetwood Mac',
        duration_ms: 300000,
        source_type: 'uploaded',
        source_ref: null,
      },
      {
        id: 'mr-jones-counting-crows',
        title: 'Mr. Jones',
        artist: 'Counting Crows',
        duration_ms: 272000,
        source_type: 'uploaded',
        source_ref: null,
      },
    ])
  })

  it('builds a google sheet export url from a share link', () => {
    expect(
      buildGoogleSheetExportUrl('https://docs.google.com/spreadsheets/d/sheet123/edit#gid=456')
    ).toBe('https://docs.google.com/spreadsheets/d/sheet123/export?format=csv&gid=456')
  })

  it('dedupes imported song records by id before upsert', () => {
    expect(
      dedupeSongImportRecords([
        { id: 'dreams-fleetwood-mac', title: 'Dreams', artist: 'Fleetwood Mac', duration_ms: 300000, source_type: 'uploaded', source_ref: null },
        { id: 'dreams-fleetwood-mac', title: 'Dreams', artist: 'Fleetwood Mac', duration_ms: 300000, source_type: 'tidal_playlist', source_ref: 'abc123' },
        { id: 'mr-jones-counting-crows', title: 'Mr. Jones', artist: 'Counting Crows', duration_ms: 271000, source_type: 'uploaded', source_ref: null },
      ])
    ).toEqual([
      { id: 'dreams-fleetwood-mac', title: 'Dreams', artist: 'Fleetwood Mac', duration_ms: 300000, source_type: 'uploaded', source_ref: null },
      { id: 'mr-jones-counting-crows', title: 'Mr. Jones', artist: 'Counting Crows', duration_ms: 271000, source_type: 'uploaded', source_ref: null },
    ])
  })

  it('maps tidal playlist tracks into importable song rows', async () => {
    vi.mocked(fetchTidalPlaylistTracks).mockResolvedValue([
      { id: 'tidal-track-1', title: 'Dreams', artist: 'Fleetwood Mac', duration: 300 },
      { id: 'tidal-track-2', title: 'Mr. Jones', artist: 'Counting Crows', duration: 271 },
    ])

    await expect(buildTidalPlaylistSongs('https://tidal.com/playlist/abc123')).resolves.toEqual([
      {
        id: 'dreams-fleetwood-mac',
        title: 'Dreams',
        artist: 'Fleetwood Mac',
        duration_ms: 300000,
        source_type: 'tidal_playlist',
        source_ref: 'abc123',
      },
      {
        id: 'mr-jones-counting-crows',
        title: 'Mr. Jones',
        artist: 'Counting Crows',
        duration_ms: 271000,
        source_type: 'tidal_playlist',
        source_ref: 'abc123',
      },
    ])
  })
})
