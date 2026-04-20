'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

type ManualQueueEntryFormProps = {
  showId?: string | null
}

export function ManualQueueEntryForm({ showId }: ManualQueueEntryFormProps) {
  const router = useRouter()
  const [singerName, setSingerName] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/band/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ singerName, title, artist, showId }),
      })

      const payload = (await response.json().catch(() => ({}))) as { message?: string }

      if (!response.ok) {
        throw new Error(payload.message ?? 'Unable to add manual queue entry.')
      }

      setMessage(payload.message ?? 'Manual queue entry added.')
      setSingerName('')
      setTitle('')
      setArtist('')
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to add manual queue entry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="manual-singer-name" className="text-sm font-medium text-slate-200">
            Singer name
          </label>
          <input
            id="manual-singer-name"
            name="singerName"
            type="text"
            value={singerName}
            onChange={(event) => setSingerName(event.target.value)}
            placeholder="Jordan"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <label htmlFor="manual-song-title" className="text-sm font-medium text-slate-200">
            Song title
          </label>
          <input
            id="manual-song-title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Dreams"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <label htmlFor="manual-song-artist" className="text-sm font-medium text-slate-200">
            Artist
          </label>
          <input
            id="manual-song-artist"
            name="artist"
            type="text"
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            placeholder="Fleetwood Mac"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {showId ? <input type="hidden" name="showId" value={showId} /> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-200"
      >
        {loading ? 'Adding...' : 'Add manual entry'}
      </button>
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  )
}
