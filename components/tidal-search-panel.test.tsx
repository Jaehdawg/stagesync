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
    expect(screen.getByPlaceholderText('Search the band song list')).toBeInTheDocument()
  })

  it('shows the catalog mode hint and requests catalog paging', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.startsWith('/api/songs/search')) {
        const searchUrl = new URL(url, 'http://localhost')
        if (!searchUrl.searchParams.get('cursor')) {
          return new Response(JSON.stringify({ songs: [{ id: '1', title: 'First', artist: 'Artist' }], nextCursor: 'cursor-2' }), { status: 200 })
        }
        return new Response(JSON.stringify({ songs: [{ id: '2', title: 'Second', artist: 'Artist' }], nextCursor: null }), { status: 200 })
      }
      return new Response(JSON.stringify({ message: 'ok' }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel sourceMode="tidal_catalog" bandId="band-1" showId="show-1" />)

    await screen.findByLabelText('Searching')
    expect(screen.getByPlaceholderText('Search the Tidal catalog')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search the Tidal catalog'), { target: { value: 'first' } })
    await screen.findByText('First')
    fireEvent.click(screen.getByRole('button', { name: /load more/i }))
    await screen.findByText('Second')
  })

  it('queues catalog selections with catalog source metadata', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.startsWith('/api/songs/search')) {
        return new Response(JSON.stringify({ songs: [{ id: 'catalog-track-1', title: 'Catalog Song', artist: 'Artist' }] }), { status: 200 })
      }
      if (url.startsWith('/api/queue')) {
        expect(JSON.parse(String(init?.body))).toEqual({
          title: 'Catalog Song',
          artist: 'Artist',
          bandId: 'band-1',
          showId: 'show-1',
          action: 'upsert',
          sourceType: 'tidal_catalog',
          sourceRef: 'catalog-track-1',
        })
        return new Response(JSON.stringify({ message: 'Song request added.' }), { status: 200 })
      }
      return new Response(JSON.stringify({ message: 'ok' }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<TidalSearchPanel sourceMode="tidal_catalog" bandId="band-1" showId="show-1" />)

    fireEvent.change(screen.getByPlaceholderText('Search the Tidal catalog'), { target: { value: 'catalog' } })
    await screen.findByText('Catalog Song')
    fireEvent.click(screen.getByRole('button', { name: /queue song/i }))
    await screen.findByRole('heading', { name: /are you ready to rock/i })
    fireEvent.click(screen.getByRole('button', { name: '👍' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/queue', expect.any(Object)))
    expect(screen.getByText(/song request added/i)).toBeInTheDocument()
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
    await screen.findByRole('heading', { name: /are you ready to rock/i })
    fireEvent.click(screen.getByRole('button', { name: '👍' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/queue', expect.any(Object)))
    expect(screen.getByText(/song request added/i)).toBeInTheDocument()
  })
})
