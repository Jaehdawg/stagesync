'use client'

import { useEffect, useState } from 'react'

type TidalTrack = {
  id: string
  title: string
  artist: string
  album?: string | null
}

type TidalSearchPanelProps = {
  disabled?: boolean
  statusMessage?: string
  sourceMode?: 'uploaded' | 'tidal_playlist' | 'tidal_catalog'
  playlistUrl?: string | null
}

export function TidalSearchPanel({ disabled = false, statusMessage, sourceMode = 'tidal_catalog', playlistUrl = null }: TidalSearchPanelProps) {
  const isCatalogMode = sourceMode === 'tidal_catalog'
  const isPlaylistMode = sourceMode === 'tidal_playlist'
  const isBrowseMode = !isCatalogMode
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<TidalTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function pickTrack(track: TidalTrack) {
    if (disabled) return

    const response = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: track.title, artist: track.artist }),
    })

    const payload = (await response.json().catch(() => ({}))) as { message?: string }

    if (!response.ok) {
      setError(payload.message ?? 'Unable to request track.')
      return
    }

    setMessage(payload.message ?? 'Song request added to the queue.')
  }

  useEffect(() => {
    let cancelled = false

    async function loadBrowseSongs() {
      if (!isBrowseMode) {
        return
      }

      setLoading(true)
      setError(null)
      setMessage(null)

      const endpoint = isPlaylistMode
        ? `/api/tidal/playlist?url=${encodeURIComponent(playlistUrl ?? '')}`
        : '/api/songs/search?query='
      const response = await fetch(endpoint)
      const payload = (await response.json().catch(() => ({}))) as { tracks?: TidalTrack[]; message?: string }

      if (cancelled) return

      if (!response.ok) {
        setError(payload.message ?? (isPlaylistMode ? 'Unable to load playlist songs.' : 'Unable to load songs.'))
        setTracks([])
        setLoading(false)
        return
      }

      const nextTracks = (payload.tracks ?? []).slice().sort((left, right) => {
        const artistCompare = left.artist.localeCompare(right.artist, undefined, { sensitivity: 'base' })
        if (artistCompare !== 0) return artistCompare
        return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
      })

      setTracks(nextTracks)
      setMessage(
        nextTracks.length
          ? `Loaded ${nextTracks.length} song${nextTracks.length === 1 ? '' : 's'}.`
          : isPlaylistMode
            ? 'No songs found in the playlist.'
            : 'No songs found.'
      )
      setLoading(false)
    }

    void loadBrowseSongs()

    return () => {
      cancelled = true
    }
  }, [isBrowseMode, isPlaylistMode, playlistUrl])

  useEffect(() => {
    if (!isCatalogMode) {
      return
    }

    const trimmed = query.trim()
    if (!trimmed) {
      setTracks([])
      setLoading(false)
      setError(null)
      setMessage(null)
      return
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        if (disabled) return

        setLoading(true)
        setError(null)
        setMessage(null)

        const response = await fetch(`/api/tidal/search?query=${encodeURIComponent(trimmed)}`)
        const payload = (await response.json().catch(() => ({}))) as { tracks?: TidalTrack[]; message?: string }

        if (!response.ok) {
          setError(payload.message ?? 'Unable to search Tidal.')
          setTracks([])
          setLoading(false)
          return
        }

        setTracks(payload.tracks ?? [])
        setMessage(
          payload.tracks?.length
            ? `Found ${payload.tracks.length} Tidal result${payload.tracks.length === 1 ? '' : 's'}.`
            : 'No Tidal results found.'
        )
        setLoading(false)
      })()
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, disabled, isCatalogMode])

  const title = 'Pick a Song'
  const description = isBrowseMode
    ? 'Browse the band’s song list, sorted by artist. Pick a song to add it to the queue while the show is active.'
    : 'Start typing to search the full Tidal catalog, then pick a song to add it to the queue while the show is active.'

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-slate-400">{description}</p>
      {sourceMode === 'tidal_playlist' && playlistUrl ? (
        <p className="mt-2 text-sm text-cyan-200">
          Playlist: <a href={playlistUrl} className="underline decoration-cyan-400/40 underline-offset-4">{playlistUrl}</a>
        </p>
      ) : null}

      {isCatalogMode ? (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="tidal-query" className="text-sm font-medium text-slate-200">Search songs</label>
            <input
              id="tidal-query"
              name="tidal-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, artist, or album"
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          {loading ? <p className="text-sm text-slate-400">Searching...</p> : null}
        </div>
      ) : null}

      {statusMessage ? <p className="mt-3 text-sm text-slate-300">{statusMessage}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
        {tracks.length ? tracks.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => void pickTrack(track)}
            disabled={disabled}
            className="flex w-full items-start justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-left transition hover:border-cyan-400/40 hover:bg-slate-900/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div>
              <p className="font-medium text-white">{track.artist}</p>
              <p className="text-sm text-slate-400">{track.title}{track.album ? ` • ${track.album}` : ''}</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200">Pick song</span>
          </button>
        )) : isCatalogMode && query.trim() ? <p className="text-sm text-slate-400">No matches yet — keep typing.</p> : null}
      </div>
    </section>
  )
}
