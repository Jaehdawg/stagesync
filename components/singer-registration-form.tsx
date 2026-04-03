'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase/client'
import { singerRegistrationFormCopy } from '@/content/en/components/singer-registration-form'

type SupabaseAuthClient = {
  auth: {
    signInWithPassword: (params: {
      email: string
      password: string
    }) => Promise<{ error: { message: string } | null }>
  }
}

type SingerRegistrationFormProps = {
  mode?: 'signup' | 'login'
  supabaseClient?: SupabaseAuthClient
  disabled?: boolean
  statusMessage?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export function SingerRegistrationForm({ mode = 'signup', supabaseClient, disabled = false, statusMessage }: SingerRegistrationFormProps) {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) {
      return
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(singerRegistrationFormCopy.errors.invalidEmail)
      return
    }

    if (mode === 'signup') {
      const trimmedFirstName = firstName.trim()
      const trimmedLastName = lastName.trim()

      if (!trimmedFirstName || !trimmedLastName) {
        setError(singerRegistrationFormCopy.errors.missingNames)
        return
      }

      if (!PASSWORD_REGEX.test(password)) {
        setError(singerRegistrationFormCopy.errors.weakPassword)
        return
      }

      setLoading(true)
      setError(null)
      setMessage(null)

      const response = await fetch('/api/singer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: trimmedEmail,
          password,
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as { message?: string }

      if (!response.ok && response.status !== 409) {
        setError(payload.message ?? singerRegistrationFormCopy.errors.signupFailed)
        setLoading(false)
        return
      }

      const client = supabaseClient ?? createClient()
      const { error: signInError } = await client.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      setMessage(payload.message ?? singerRegistrationFormCopy.messages.signupSuccess)
      setLoading(false)
      router.refresh()
      return
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(singerRegistrationFormCopy.errors.weakPassword)
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    const client = supabaseClient ?? createClient()
    const { error: signInError } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    setMessage(singerRegistrationFormCopy.messages.loginSuccess)
    setLoading(false)
    router.refresh()
  }

  return (
    <form className="rounded-2xl border border-white/10 bg-white/5 p-5" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-white">{mode === 'signup' ? singerRegistrationFormCopy.titles.signup : singerRegistrationFormCopy.titles.login}</h3>
      <p className="mt-1 text-slate-400">
        {mode === 'signup' ? singerRegistrationFormCopy.descriptions.signup : singerRegistrationFormCopy.descriptions.login}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {mode === 'signup' ? (
          <>
            <div className="space-y-2 sm:col-span-1">
              <label htmlFor="first-name" className="text-sm font-medium text-slate-200">
                {singerRegistrationFormCopy.labels.firstName}
              </label>
              <input
                id="first-name"
                name="first-name"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder={singerRegistrationFormCopy.placeholders.firstName}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <label htmlFor="last-name" className="text-sm font-medium text-slate-200">
                {singerRegistrationFormCopy.labels.lastName}
              </label>
              <input
                id="last-name"
                name="last-name"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder={singerRegistrationFormCopy.placeholders.lastName}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </>
        ) : null}
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-200">
            {singerRegistrationFormCopy.labels.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={singerRegistrationFormCopy.placeholders.email}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-200">
            {singerRegistrationFormCopy.labels.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === 'signup' ? singerRegistrationFormCopy.placeholders.signupPassword : singerRegistrationFormCopy.placeholders.loginPassword}
            minLength={8}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          <p className="text-xs text-slate-500">
            {mode === 'signup' ? singerRegistrationFormCopy.helperText.signup : singerRegistrationFormCopy.helperText.login}
          </p>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || disabled}
        className="mt-4 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-200"
      >
        {disabled ? singerRegistrationFormCopy.buttons.paused : loading ? singerRegistrationFormCopy.buttons.signingIn : mode === 'signup' ? singerRegistrationFormCopy.buttons.signup : singerRegistrationFormCopy.buttons.login}
      </button>
      {statusMessage ? <p className="mt-3 text-sm text-slate-300">{statusMessage}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </form>
  )
}
