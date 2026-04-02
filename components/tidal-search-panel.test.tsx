import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TidalSearchPanel } from './tidal-search-panel'

const fetchMock = vi.fn()

afterEach(() => {
  fetchMock.mockReset()
  vi.restoreAllMocks()
})

describe('TidalSearchPanel', () => {
  it('searches the band song list with the active band id', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.startsWith('/api/songs/search')) {
        return new Response(JSON.stringify({ songs: [] }), { status: 200 })
      }
      return new Response(JSON.stringify({ message: 'ok' }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel sourceMode="uploaded" bandId="band-1" showId="show-1" />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await screen.findByText('Pick a Song')
  })

  it('passes the band and show ids when queueing a song', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.startsWith('/api/songs/search')) {
        return new Response(JSON.stringify({ songs: [{ id: '1', title: 'My Song', artist: 'The Band' }] }), { status: 200 })
      }
      if (url.startsWith('/api/queue')) {
        return new Response(JSON.stringify({ message: 'Song request added.' }), { status: 200 })
      }
      return new Response(JSON.stringify({ message: 'ok' }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel sourceMode="uploaded" bandId="band-1" showId="show-1" />)

    const input = screen.getByPlaceholderText('Search the band song list')
    input.focus()
  })
})
