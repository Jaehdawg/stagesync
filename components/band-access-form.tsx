'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase/client'

type SupabaseAuthClient = {
  auth: {
    signInWithPassword: (params: { email: string; password: string }) => Promise<{ error: { message: string } | null }>
  }
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: { email: string | null; role: string | null } | null }> }
    }
  }
}

type BandAccessFormProps = {
  role: 'band' | 'admin'
  title: string
  description: string
  submitLabel: string
  successMessage: string
  supabaseClient?: SupabaseAuthClient
}

export function BandAccessForm({
  role,
  title,
  description,
  submitLabel,
  successMessage,
  supabaseClient,
}: BandAccessFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const client = supabaseClient ?? createClient()
    const lookupResponse = (await client
      .from('profiles')
      .select('email, role')
      .eq('username', username)
      .maybeSingle()) as {
      data: { email: string | null; role: string | null } | null
      error?: { message: string } | null
    }

    const { data: profile, error: lookupError } = lookupResponse

    if (lookupError) {
      setError(lookupError.message)
      setLoading(false)
      return
    }

    if (!profile?.email || profile.role !== role) {
      setError(`No ${role} account found for that username.`)
      setLoading(false)
      return
    }

    const { error: signInError } = await client.auth.signInWithPassword({
      email: profile.email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    setMessage(successMessage)
    setLoading(false)
    router.push(role === 'band' ? '/band' : '/admin')
    router.refresh()
  }

  return (
    <form className="rounded-2xl border border-white/10 bg-white/5 p-5" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-slate-400">{description}</p>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor={`${role}-username`} className="text-sm font-medium text-slate-200">
            Username
          </label>
          <input
            id={`${role}-username`}
            name={`${role}-username`}
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={`${role} username`}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${role}-password`} className="text-sm font-medium text-slate-200">
            Password
          </label>
          <input
            id={`${role}-password`}
            name={`${role}-password`}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-200"
      >
        {loading ? 'Signing in...' : submitLabel}
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </form>
  )
}
