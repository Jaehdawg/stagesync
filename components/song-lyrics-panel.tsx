'use client'

import { useEffect, useState } from 'react'

type SongLyricsPanelProps = {
  artist?: string | null
  title?: string | null
}

export function SongLyricsPanel({ artist, title }: SongLyricsPanelProps) {
  const safeArtist = String(artist ?? '').trim()
  const safeTitle = String(title ?? '').trim()
  const [open, setOpen] = useState(false)
  const [lyrics, setLyrics] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!safeArtist || !safeTitle) {
      setLyrics('')
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    let cancelled = false

    async function loadLyrics() {
      setLoading(true)
      setError(null)
      try {
        const url = `/api/lyrics?artist=${encodeURIComponent(String(safeArtist))}&title=${encodeURIComponent(String(safeTitle))}`
        const response = await fetch(url, { signal: controller.signal })
        const data = (await response.json().catch(() => ({}))) as { lyrics?: string; message?: string }
        if (cancelled) return
        if (!response.ok) {
          throw new Error(data.message ?? 'Unable to load lyrics.')
        }
        setLyrics(data.lyrics ?? '')
      } catch (fetchError) {
        if (cancelled) return
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load lyrics.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadLyrics()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [safeArtist, safeTitle])

  const canShowLyrics = Boolean(safeArtist && safeTitle)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canShowLyrics}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-2xl shadow-black/30 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Lyrics
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="flex w-full max-w-3xl flex-col rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-yellow-300">Lyrics</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {safeTitle ? `${safeTitle} — ${safeArtist}` : 'Pick a song'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-6 max-h-[70vh] overflow-y-auto pr-2">
              {!canShowLyrics ? (
                <p className="text-sm text-slate-400">Pick a song to see lyrics.</p>
              ) : loading ? (
                <p className="text-sm text-slate-400">Loading lyrics…</p>
              ) : error ? (
                <p className="text-sm text-rose-300">{error}</p>
              ) : lyrics ? (
                <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{lyrics}</pre>
              ) : (
                <p className="text-sm text-slate-400">Lyrics not found.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
