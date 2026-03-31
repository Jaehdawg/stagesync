'use client'

import { useState, type FormEvent } from 'react'

type SongRequestFormProps = {
  disabled?: boolean
  statusMessage?: string
}

export function SongRequestForm({ disabled = false, statusMessage }: SongRequestFormProps) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (disabled) {
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    const response = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist }),
    })

    const payload = (await response.json().catch(() => ({}))) as { message?: string }

    if (!response.ok) {
      setError(payload.message ?? 'Unable to add song request.')
      setLoading(false)
      return
    }

    setMessage(payload.message ?? 'Song request added to the queue.')
    setTitle('')
    setArtist('')
    setLoading(false)
  }

  return (
    <form className="rounded-2xl border border-white/10 bg-white/5 p-5" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-white">Request a song</h3>
      <p className="mt-1 text-slate-400">
        Add a song request while the show is active. Requests close when the band pauses or ends the show.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-1">
          <label htmlFor="song-title" className="text-sm font-medium text-slate-200">
            Song title
          </label>
          <input
            id="song-title"
            name="song-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Dreams"
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <label htmlFor="song-artist" className="text-sm font-medium text-slate-200">
            Artist
          </label>
          <input
            id="song-artist"
            name="song-artist"
            type="text"
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            placeholder="Fleetwood Mac"
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={disabled || loading}
        className="mt-4 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-200"
      >
        {disabled ? 'Signups paused' : loading ? 'Adding...' : 'Add to queue'}
      </button>
      {statusMessage ? <p className="mt-3 text-sm text-slate-300">{statusMessage}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </form>
  )
}
