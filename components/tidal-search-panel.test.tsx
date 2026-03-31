import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { TidalSearchPanel } from './tidal-search-panel'

describe('TidalSearchPanel', () => {
  it('searches and requests a tidal track', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tracks: [{ id: 'tidal-1', title: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Song request added to the queue.' }),
      })

    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel />)

    fireEvent.change(screen.getByLabelText(/search songs/i), { target: { value: 'Dreams' } })
    fireEvent.click(screen.getByRole('button', { name: /search tidal/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(screen.getByText(/found 1 tidal result/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /request/i }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('searches the uploaded song library when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tracks: [{ id: 'song-1', title: 'Dreams', artist: 'Fleetwood Mac' }] }),
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel sourceMode="uploaded" />)

    fireEvent.change(screen.getByLabelText(/search songs/i), { target: { value: 'Dreams' } })
    fireEvent.click(screen.getByRole('button', { name: /search songs/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/songs/search?query=Dreams')
    expect(screen.getByText(/found 1 song/i)).toBeInTheDocument()
  })
})
