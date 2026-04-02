'use client'

import { useEffect, useState } from 'react'

type TidalTrack = {
  id: string
  title: string
  artist: string
  album?: string | null
  duration?: number | null
}

type TidalSearchPanelProps = {
  disabled?: boolean
  statusMessage?: string
  sourceMode?: 'uploaded' | 'tidal_playlist'
  playlistUrl?: string | null
  bandId: string
  showId: string
}

export function TidalSearchPanel({ disabled = false, statusMessage, sourceMode = 'uploaded', playlistUrl = null, bandId, showId }: TidalSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<TidalTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<TidalTrack | null>(null)

  async function pickTrack(track: TidalTrack) {
    if (disabled) return

    const response = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: track.title, artist: track.artist, bandId, showId }),
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

    async function loadSongs() {
      setLoading(true)
      setError(null)
      setMessage(null)

      const response = await fetch(`/api/songs/search?bandId=${encodeURIComponent(bandId)}&showId=${encodeURIComponent(showId)}&query=${encodeURIComponent(query.trim())}`)
      const payload = (await response.json().catch(() => ({}))) as { tracks?: TidalTrack[]; message?: string }

      if (cancelled) return

      if (!response.ok) {
        setError(payload.message ?? 'Unable to load songs.')
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
          : 'No songs found.'
      )
      setLoading(false)
    }

    void loadSongs()

    return () => {
      cancelled = true
    }
  }, [query, disabled, bandId, showId])

  const title = 'Pick a Song'

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {sourceMode === 'tidal_playlist' && playlistUrl ? (
        <p className="mt-2 text-sm text-cyan-200">
          Playlist: <a href={playlistUrl} className="underline decoration-cyan-400/40 underline-offset-4">{playlistUrl}</a>
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="song-library-query" className="text-sm font-medium text-slate-200">
            Search song library
          </label>
          <input
            id="song-library-query"
            name="song-library-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or artist"
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        {loading ? <p className="text-sm text-slate-400">Searching...</p> : null}
      </div>

      {statusMessage ? <p className="mt-3 text-sm text-slate-300">{statusMessage}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
        {tracks.length ? tracks.map((track) => (
          <div
            key={track.id}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-left transition hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{track.artist}</p>
              <p className="text-sm text-slate-400 break-words">{track.title}{track.album ? ` • ${track.album}` : ''}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTrack(track)}
              disabled={disabled}
              className="shrink-0 whitespace-nowrap rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Select
            </button>
          </div>
        )) : query.trim() ? <p className="text-sm text-slate-400">No matches yet — keep typing.</p> : null}
      </div>

      {selectedTrack ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/50">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Ready to Rock?</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{selectedTrack.title}</h3>
            <p className="mt-1 text-slate-400">{selectedTrack.artist}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  void pickTrack(selectedTrack)
                  setSelectedTrack(null)
                }}
                className="flex-1 rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                👍
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrack(null)}
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                👎
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
