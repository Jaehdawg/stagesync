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
  const [query, setQuery] = useState('')
  const [playlistOnly, setPlaylistOnly] = useState(true)
  const [results, setResults] = useState<TidalTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function runSearch(searchText: string) {
    const trimmed = searchText.trim()

    if (!trimmed || disabled) {
      setResults([])
      setLoading(false)
      setError(null)
      setMessage(null)
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    const endpoint = sourceMode === 'uploaded'
      ? `/api/songs/search?query=${encodeURIComponent(trimmed)}`
      : `/api/tidal/search?query=${encodeURIComponent(trimmed)}&playlistOnly=${playlistOnly}`
    const response = await fetch(endpoint)
    const payload = (await response.json().catch(() => ({}))) as { tracks?: TidalTrack[]; message?: string }

    if (!response.ok) {
      setError(payload.message ?? (sourceMode === 'uploaded' ? 'Unable to search uploaded songs.' : 'Unable to search Tidal.'))
      setResults([])
      setLoading(false)
      return
    }

    setResults(payload.tracks ?? [])
    setMessage(
      payload.tracks?.length
        ? `Found ${payload.tracks.length} ${sourceMode === 'uploaded' ? 'song' : 'Tidal result'}${payload.tracks.length === 1 ? '' : 's'}.`
        : sourceMode === 'uploaded'
          ? 'No uploaded songs found.'
          : 'No Tidal results found.'
    )
    setLoading(false)
  }

  useEffect(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      setResults([])
      setLoading(false)
      setError(null)
      setMessage(null)
      return
    }

    const timer = window.setTimeout(() => {
      void runSearch(trimmed)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, playlistOnly, sourceMode, disabled])

  async function handlePick(track: TidalTrack) {
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

  const isUploaded = sourceMode === 'uploaded'
  const title = 'Pick a Song'
  const description = isUploaded
    ? 'Start typing to search the band’s uploaded song library, then pick a song to add it to the queue while the show is active.'
    : 'Start typing to search Tidal, then pick a song to add it to the queue while the show is active.'

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-slate-400">{description}</p>
      {sourceMode === 'tidal_playlist' && playlistUrl ? (
        <p className="mt-2 text-sm text-cyan-200">
          Playlist: <a href={playlistUrl} className="underline decoration-cyan-400/40 underline-offset-4">{playlistUrl}</a>
        </p>
      ) : null}

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

        {sourceMode !== 'uploaded' ? (
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => setPlaylistOnly(true)}
              className={`rounded-full border px-4 py-2 font-medium ${playlistOnly ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-slate-900/80 text-slate-200'}`}
            >
              Playlist
            </button>
            <button
              type="button"
              onClick={() => setPlaylistOnly(false)}
              className={`rounded-full border px-4 py-2 font-medium ${!playlistOnly ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-slate-900/80 text-slate-200'}`}
            >
              Full catalog
            </button>
          </div>
        ) : null}

        {loading ? <p className="text-sm text-slate-400">Searching...</p> : null}
      </div>

      {statusMessage ? <p className="mt-3 text-sm text-slate-300">{statusMessage}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {results.length ? results.map((track) => (
          <div key={track.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{track.title}</p>
                <p className="text-sm text-slate-400">{track.artist}{track.album ? ` • ${track.album}` : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => void handlePick(track)}
                disabled={disabled}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Pick song
              </button>
            </div>
          </div>
        )) : query.trim() ? <p className="text-sm text-slate-400">No matches yet — keep typing.</p> : null}
      </div>
    </section>
  )
}
