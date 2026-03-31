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
          first_name: string
          last_name: string
          role: string
        }
      }
    }) => Promise<{ error: { message: string } | null }>
  }
}

type SingerRegistrationFormProps = {
  supabaseClient?: SupabaseAuthClient
  disabled?: boolean
  statusMessage?: string
}

export function SingerRegistrationForm({ supabaseClient, disabled = false, statusMessage }: SingerRegistrationFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
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

    const client = supabaseClient ?? createClient()
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || window.location.origin

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(appUrl),
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'singer',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage('Check your email for the StageSync magic link. Your place in the queue starts there.')
    setLoading(false)
  }

  return (
    <form className="rounded-2xl border border-white/10 bg-white/5 p-5" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-white">Quick registration</h3>
      <p className="mt-1 text-slate-400">
        Capture first name, last name, and email before the singer joins the queue.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-1">
          <label htmlFor="first-name" className="text-sm font-medium text-slate-200">
            First name
          </label>
          <input
            id="first-name"
            name="first-name"
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Maya"
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <label htmlFor="last-name" className="text-sm font-medium text-slate-200">
            Last name
          </label>
          <input
            id="last-name"
            name="last-name"
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Chen"
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="maya@example.com"
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || disabled}
        className="mt-4 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-200"
      >
        {disabled ? 'Signups paused' : loading ? 'Sending...' : 'Send magic link'}
      </button>
      {statusMessage ? <p className="mt-3 text-sm text-slate-300">{statusMessage}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </form>
  )
}
