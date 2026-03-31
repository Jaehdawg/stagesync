'use client'

import { useState, type FormEvent } from 'react'

type TidalTrack = {
  id: string
  title: string
  artist: string
  album?: string | null
}

type TidalSearchPanelProps = {
  disabled?: boolean
  statusMessage?: string
}

export function TidalSearchPanel({ disabled = false, statusMessage }: TidalSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [playlistOnly, setPlaylistOnly] = useState(true)
  const [results, setResults] = useState<TidalTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    setLoading(true)
    setError(null)
    setMessage(null)

    const response = await fetch(`/api/tidal/search?query=${encodeURIComponent(query)}&playlistOnly=${playlistOnly}`)
    const payload = (await response.json().catch(() => ({}))) as { tracks?: TidalTrack[]; message?: string }

    if (!response.ok) {
      setError(payload.message ?? 'Unable to search Tidal.')
      setResults([])
      setLoading(false)
      return
    }

    setResults(payload.tracks ?? [])
    setMessage(payload.tracks?.length ? `Found ${payload.tracks.length} Tidal result${payload.tracks.length === 1 ? '' : 's'}.` : 'No Tidal results found.')
    setLoading(false)
  }

  async function requestTrack(track: TidalTrack) {
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

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">Tidal search</h3>
      <p className="mt-1 text-slate-400">
        Search Tidal, pick a song, and add it to the queue while the show is active.
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleSearch}>
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

        <button
          type="submit"
          disabled={disabled || loading}
          className="inline-flex rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-200"
        >
          {loading ? 'Searching...' : 'Search Tidal'}
        </button>
      </form>

      {statusMessage ? <p className="mt-3 text-sm text-slate-300">{statusMessage}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {results.map((track) => (
          <div key={track.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{track.title}</p>
                <p className="text-sm text-slate-400">{track.artist}{track.album ? ` • ${track.album}` : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => requestTrack(track)}
                disabled={disabled}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Request
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
