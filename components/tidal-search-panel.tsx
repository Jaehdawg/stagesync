'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type TidalTrack = {
  id: string
  title: string
  artist: string
  album?: string | null
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
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<TidalTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [queueingId, setQueueingId] = useState<string | null>(null)

  const searchUrl = useMemo(
    () => `/api/songs/search?bandId=${encodeURIComponent(bandId)}${query.trim() ? `&query=${encodeURIComponent(query.trim())}` : ''}`,
    [bandId, query]
  )

  async function queueTrack(track: TidalTrack) {
    if (disabled) return

    setQueueingId(track.id)
    setError(null)

    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: track.title, artist: track.artist, bandId, showId, action: 'upsert' }),
      })

      const payload = (await response.json().catch(() => ({}))) as { message?: string }
      if (!response.ok) {
        throw new Error(payload.message ?? 'Unable to add song request.')
      }

      setMessage(payload.message ?? `Queued ${track.title}.`)
      router.refresh()
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to add song request.')
    } finally {
      setQueueingId(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function loadTracks() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(searchUrl)
        const data = (await response.json().catch(() => ({}))) as { songs?: TidalTrack[]; message?: string }
        if (cancelled) return
        if (!response.ok) {
          throw new Error(data.message ?? 'Unable to search songs.')
        }
        setTracks(data.songs ?? [])
      } catch (fetchError) {
        if (cancelled) return
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to search songs.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadTracks()
    return () => {
      cancelled = true
    }
  }, [searchUrl])

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">Pick a Song</h3>
      {sourceMode === 'tidal_playlist' && playlistUrl ? (
        <p className="mt-2 text-sm text-cyan-200">Imported Tidal playlist available.</p>
      ) : null}
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search the band song list"
        className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
        disabled={disabled}
      />
      {statusMessage ? <p className="mt-3 text-sm text-slate-300">{statusMessage}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
        {loading ? <p className="text-sm text-slate-400">Searching…</p> : null}
        {tracks.length ? tracks.map((track) => (
          <div key={track.id} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{track.artist}</p>
              <p className="break-words text-sm text-slate-400">{track.title}{track.album ? ` • ${track.album}` : ''}</p>
            </div>
            <button
              type="button"
              onClick={() => void queueTrack(track)}
              disabled={disabled || queueingId === track.id}
              className="shrink-0 whitespace-nowrap rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {queueingId === track.id ? 'Queueing…' : 'Queue song'}
            </button>
          </div>
        )) : !loading ? <p className="text-sm text-slate-400">No matches yet.</p> : null}
      </div>
    </section>
  )
}
