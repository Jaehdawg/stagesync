import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

  it('queues a song with the active band and show ids', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.startsWith('/api/songs/search')) {
        return new Response(JSON.stringify({ songs: [{ id: '1', title: 'My Song', artist: 'The Band' }] }), { status: 200 })
      }
      if (url.startsWith('/api/queue')) {
        expect(init?.method).toBe('POST')
        expect(init?.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }))
        expect(JSON.parse(String(init?.body))).toEqual({
          title: 'My Song',
          artist: 'The Band',
          bandId: 'band-1',
          showId: 'show-1',
          action: 'upsert',
        })
        return new Response(JSON.stringify({ message: 'Song request added.' }), { status: 200 })
      }
      return new Response(JSON.stringify({ message: 'ok' }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel sourceMode="uploaded" bandId="band-1" showId="show-1" />)

    await screen.findByText('My Song')
    fireEvent.click(screen.getByRole('button', { name: /queue song/i }))
    await screen.findByRole('heading', { name: /are you ready rock/i })
    fireEvent.click(screen.getByRole('button', { name: '👍' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/queue', expect.any(Object)))
    expect(screen.getByText(/song request added/i)).toBeInTheDocument()
  })
})
