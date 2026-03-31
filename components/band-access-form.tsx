'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '../utils/supabase/client'
import { buildAuthCallbackUrl } from '../lib/auth'

type SupabaseAuthClient = {
  auth: {
    signInWithOtp: (params: {
      email: string
      options: {
        emailRedirectTo: string
        data: {
          role: string
        }
      }
    }) => Promise<{ error: { message: string } | null }>
  }
}

type BandAccessFormProps = {
  supabaseClient?: SupabaseAuthClient
}

export function BandAccessForm({ supabaseClient }: BandAccessFormProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const client = supabaseClient ?? createClient()
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || window.location.origin

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(appUrl),
        data: {
          role: 'band',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage('Check your email for the band login link.')
    setLoading(false)
  }

  return (
    <form className="rounded-2xl border border-white/10 bg-white/5 p-5" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-white">Band login</h3>
      <p className="mt-1 text-slate-400">
        Band members use a magic link to access queue controls and show management.
      </p>
      <div className="mt-4 space-y-2">
        <label htmlFor="band-email" className="text-sm font-medium text-slate-200">
          Email
        </label>
        <input
          id="band-email"
          name="band-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="band@example.com"
          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-200"
      >
        {loading ? 'Sending...' : 'Send band login link'}
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </form>
  )
}
