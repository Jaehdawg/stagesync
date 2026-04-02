'use client'

import { useEffect, useState } from 'react'

type SongLyricsPanelProps = {
  artist?: string | null
  title?: string | null
}

export function SongLyricsPanel({ artist, title }: SongLyricsPanelProps) {
  const [lyrics, setLyrics] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const safeArtist = artist?.trim()
    const safeTitle = title?.trim()
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
        const response = await fetch(`/api/lyrics?artist=${encodeURIComponent(safeArtist)}&title=${encodeURIComponent(safeTitle)}`, {
          signal: controller.signal,
        })
        const data = (await response.json().catch(() => ({}))) as { lyrics?: string; message?: string }
        if (cancelled) return
        if (!response.ok) {
          throw new Error(data.message ?? 'Unable to load lyrics.')
        }
        setLyrics(data.lyrics ?? '')
      } catch (error) {
        if (cancelled) return
        setError(error instanceof Error ? error.message : 'Unable to load lyrics.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadLyrics()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [artist, title])

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">Lyrics</h3>
      {!artist || !title ? (
        <p className="mt-3 text-sm text-slate-400">Pick a song to see lyrics.</p>
      ) : loading ? (
        <p className="mt-3 text-sm text-slate-400">Loading lyrics…</p>
      ) : error ? (
        <p className="mt-3 text-sm text-rose-300">{error}</p>
      ) : lyrics ? (
        <pre className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-200">{lyrics}</pre>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Lyrics not found.</p>
      )}
    </section>
  )
}
