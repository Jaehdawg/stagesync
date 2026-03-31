import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getTestSession } from '@/lib/test-session'
import { getTestLogin } from '@/lib/test-login-list'

export default async function BandAccountPage() {
  const testSession = await getTestSession()
  const supabase = await createClient()

  if (testSession?.role !== 'band') {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Band account</h1>
            <p className="mt-3 max-w-2xl text-slate-300">Band login required.</p>
          </header>
          <BandAccessForm role="band" title="Band login" description="Use your band username and password to access show controls." submitLabel="Sign in" successMessage="Band login successful." />
        </div>
      </main>
    )
  }

  const current = await getTestLogin(supabase, testSession.username)
  if (!current || current.band_access_level !== 'admin') {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Band account</h1>
            <p className="mt-3 max-w-2xl text-slate-300">Band admin access required.</p>
          </header>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Band account</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Update your band admin username and password.</p>
            </div>
            <Link href="/band" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">Back to band dashboard</Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <form className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action="/api/band/account" method="post">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="band-username">Username</label>
              <input id="band-username" name="username" defaultValue={current.username} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="band-password">Password</label>
              <input id="band-password" name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save account</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
