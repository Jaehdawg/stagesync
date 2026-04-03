'use client'

import { useState } from 'react'
import { singerCurrentRequestCardCopy } from '@/content/en/components/singer-current-request-card'

type SingerCurrentRequestCardProps = {
  bandId: string
  showId: string
  artist: string
  title: string
  onCancelled?: () => void
}

export function SingerCurrentRequestCard({ bandId, showId, artist, title, onCancelled }: SingerCurrentRequestCardProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cancelRequest() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', bandId, showId }),
      })
      const payload = (await response.json().catch(() => ({}))) as { message?: string }
      if (!response.ok) {
        throw new Error(payload.message ?? '{singerCurrentRequestCardCopy.unableToCancel}')
      }
      setOpen(false)
      onCancelled?.()
    } catch (error) {
      setError(error instanceof Error ? error.message : '{singerCurrentRequestCardCopy.unableToCancel}')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold text-white">{singerCurrentRequestCardCopy.title}</h3>
        <p className="mt-3 text-lg font-semibold text-white">{artist}</p>
        <p className="text-slate-300">{title}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {singerCurrentRequestCardCopy.changeSong}
        </button>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/50">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">{singerCurrentRequestCardCopy.cancelEyebrow}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{singerCurrentRequestCardCopy.cancelTitle}</h3>
            <p className="mt-2 text-slate-400">{singerCurrentRequestCardCopy.cancelBody}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => void cancelRequest()}
                className="flex-1 rounded-full bg-rose-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-rose-300 disabled:opacity-60"
              >
                👍
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                👎
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
