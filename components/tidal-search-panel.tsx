'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { tidalSearchPanelCopy } from '@/content/en/components/tidal-search-panel'

type TidalTrack = {
  id: string
  title: string
  artist: string
  album?: string | null
}

type SearchResponse = {
  songs?: TidalTrack[]
  nextCursor?: string | null
  message?: string
}

type TidalSearchPanelProps = {
  disabled?: boolean
  statusMessage?: string
  sourceMode?: 'uploaded' | 'tidal_playlist' | 'tidal_catalog'
  playlistUrl?: string | null
  bandId: string
  showId: string
  onQueued?: (track: TidalTrack) => void
}

export function TidalSearchPanel({ disabled = false, statusMessage, sourceMode = 'uploaded', playlistUrl = null, bandId, showId, onQueued }: TidalSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<TidalTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [queueingId, setQueueingId] = useState<string | null>(null)
  const [pendingTrack, setPendingTrack] = useState<TidalTrack | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const searchUrl = useMemo(
    () => `/api/songs/search?bandId=${encodeURIComponent(bandId)}&sourceMode=${encodeURIComponent(sourceMode)}${query.trim() ? `&query=${encodeURIComponent(query.trim())}` : ''}`,
    [bandId, sourceMode, query]
  )

  async function loadPage(cursor: string | null, append: boolean) {
    if (disabled) return
    if (append && (!cursor || loadingMore)) return
    if (!append && loading) return

    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setTracks([])
      setNextCursor(null)
    }
    setError(null)

    try {
      const url = new URL(searchUrl, 'http://localhost')
      if (cursor) {
        url.searchParams.set('cursor', cursor)
      }

      const response = await fetch(`${url.pathname}${url.search}`)
      const data = (await response.json().catch(() => ({}))) as SearchResponse
      if (!response.ok) {
        throw new Error(data.message ?? tidalSearchPanelCopy.unableToSearch)
      }

      setTracks((current) => (append ? [...current, ...(data.songs ?? [])] : (data.songs ?? [])))
      setNextCursor(data.nextCursor ?? null)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : tidalSearchPanelCopy.unableToSearch)
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

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
        throw new Error(payload.message ?? tidalSearchPanelCopy.unableToAdd)
      }

      setMessage(payload.message ?? tidalSearchPanelCopy.queueMessage(track.title))
      onQueued?.(track)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : tidalSearchPanelCopy.unableToAdd)
    } finally {
      setQueueingId(null)
    }
  }

  useEffect(() => {
    void loadPage(null, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchUrl, retryToken, disabled])

  function maybeLoadMore() {
    const node = listRef.current
    if (!node || loading || loadingMore || !nextCursor || disabled) return
    const nearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 120
    if (nearBottom) {
      void loadPage(nextCursor, true)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">{tidalSearchPanelCopy.title}</h3>
      {sourceMode === 'tidal_playlist' && playlistUrl ? (
        <p className="mt-2 text-sm text-cyan-200">{tidalSearchPanelCopy.importedPlaylist}</p>
      ) : null}
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={tidalSearchPanelCopy.placeholder}
        className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
        disabled={disabled}
      />
      {statusMessage ? <p className="mt-3 text-sm text-slate-300">{statusMessage}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setRetryToken((value) => value + 1)
            }}
            className="rounded-full border border-rose-300/30 px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-400/10"
          >
            {tidalSearchPanelCopy.retry}
          </button>
        </div>
      ) : null}
      <div ref={listRef} onScroll={maybeLoadMore} className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
        {loading ? <p className="text-sm text-slate-400">{tidalSearchPanelCopy.searching}</p> : null}
        {tracks.length ? tracks.map((track) => (
          <div key={track.id} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{track.artist}</p>
              <p className="break-words text-sm text-slate-400">{track.title}{track.album ? ` • ${track.album}` : ''}</p>
            </div>
            <button
              type="button"
              onClick={() => setPendingTrack(track)}
              disabled={disabled || queueingId === track.id}
              className="shrink-0 whitespace-nowrap rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {queueingId === track.id ? tidalSearchPanelCopy.queueing : tidalSearchPanelCopy.queueSong}
            </button>
          </div>
        )) : !loading ? <p className="text-sm text-slate-400">{tidalSearchPanelCopy.noMatches}</p> : null}
        {loadingMore ? <p className="text-sm text-slate-400">{tidalSearchPanelCopy.searching}</p> : null}
        {nextCursor && !loadingMore ? <button type="button" onClick={() => void loadPage(nextCursor, true)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">Load more</button> : null}
      </div>

      {pendingTrack ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/50">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">{tidalSearchPanelCopy.readyEyebrow}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{tidalSearchPanelCopy.readyTitle}</h3>
            <p className="mt-2 text-slate-400">{pendingTrack.artist} — {pendingTrack.title}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={disabled || queueingId === pendingTrack.id}
                onClick={() => {
                  const track = pendingTrack
                  setPendingTrack(null)
                  void queueTrack(track)
                }}
                className="flex-1 rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
              >
                👍
              </button>
              <button
                type="button"
                disabled={disabled || queueingId === pendingTrack.id}
                onClick={() => setPendingTrack(null)}
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
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
