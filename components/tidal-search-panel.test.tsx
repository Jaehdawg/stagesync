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

    render(<TidalSearchPanel sourceMode="uploaded" />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/songs/search?query='))
    expect(screen.getByText('Fleetwood Mac')).toBeInTheDocument()
    expect(screen.getByText('Yeah Yeah Yeahs')).toBeInTheDocument()
    expect(screen.getByText('Dreams')).toBeInTheDocument()
    expect(screen.getByText('Maps')).toBeInTheDocument()
  })

  it('searches the full tidal catalog with typeahead when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tracks: [{ id: 'tidal-1', title: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours' }] }),
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel sourceMode="tidal_catalog" />)

    fireEvent.change(screen.getByLabelText(/search tidal catalog/i), { target: { value: 'Dreams' } })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/tidal/search?query=Dreams'))
    expect(screen.getByText(/found 1 tidal result/i)).toBeInTheDocument()
    expect(screen.getByText('Fleetwood Mac')).toBeInTheDocument()
  })

  it('shows the linked tidal playlist while browsing the band song library', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tracks: [] }),
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel sourceMode="tidal_playlist" playlistUrl="https://tidal.com/browse/playlist/abc123" />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/songs/search?query='))

    expect(screen.getByText(/playlist:/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /https:\/\/tidal\.com\/browse\/playlist\/abc123/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/search song library/i)).toBeInTheDocument()
  })
})
