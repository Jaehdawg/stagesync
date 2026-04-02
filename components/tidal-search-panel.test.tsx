import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { TidalSearchPanel } from './tidal-search-panel'

describe('TidalSearchPanel', () => {
  it('shows the band song library as a scrollable list when configured for uploads', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tracks: [
          { id: 'song-1', title: 'Dreams', artist: 'Fleetwood Mac' },
          { id: 'song-2', title: 'Maps', artist: 'Yeah Yeah Yeahs' },
        ],
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel sourceMode="uploaded" bandId="band-1" showId="show-1" />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/songs/search?bandId=band-1&showId=show-1&query='))
    expect(screen.getByText('Fleetwood Mac')).toBeInTheDocument()
    expect(screen.getByText('Yeah Yeah Yeahs')).toBeInTheDocument()
    expect(screen.getByText('Dreams')).toBeInTheDocument()
    expect(screen.getByText('Maps')).toBeInTheDocument()
  })

  it('searches the stored song library with typeahead when configured for tidal playlists', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tracks: [{ id: 'song-1', title: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours' }] }),
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel sourceMode="tidal_playlist" playlistUrl="https://tidal.com/browse/playlist/abc123" bandId="band-1" showId="show-1" />)

    fireEvent.change(screen.getByLabelText(/search song library/i), { target: { value: 'Dreams' } })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/songs/search?bandId=band-1&showId=show-1&query=Dreams'))
    expect(screen.getByText(/loaded 1 song/i)).toBeInTheDocument()
    expect(screen.getByText('Fleetwood Mac')).toBeInTheDocument()
    expect(screen.getByText(/playlist:/i)).toBeInTheDocument()
  })
})
