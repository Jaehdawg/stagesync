import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getTestSession } from '@/lib/test-session'
import { BandAccessForm } from '@/components/band-access-form'

export default async function AdminAnalyticsPage() {
  const testSession = await getTestSession()
  const supabase = await createClient()

  if (testSession?.role !== 'admin') {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
            <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">System analytics</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Admin access required.</p>
            </header>
            <BandAccessForm
              role="admin"
              title="Admin login"
              description="Use your admin username and password to access system controls."
              submitLabel="Sign in"
              successMessage="Admin login successful."
            />
          </div>
        </main>
      )
    }
  }

  const [{ count: showCount }, { count: activeShowCount }, { count: singerCount }, { count: tracksPlayedCount }, { data: recentShows }] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'singer'),
    supabase.from('queue_items').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('events').select('id, name, is_active, allow_signups, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">System analytics</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Visibility into shows, singers, and track utilization.
              </p>
            </div>
            <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">
              Back to admin
            </Link>
          </div>
          <form className="mt-4" action="/api/auth/logout" method="post">
            <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
              Log out
            </button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Band-shows', value: String(showCount ?? 0) },
            { label: activeShowCount ? '🤘 Active Show' : '⛔️ Active Show', value: String(activeShowCount ? 1 : 0) },
            { label: 'Singer count', value: String(singerCount ?? 0) },
            { label: 'Tracks played', value: String(tracksPlayedCount ?? 0) },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Recent shows</h2>
          <div className="mt-4 space-y-3">
            {(recentShows ?? []).map((show) => (
              <div key={show.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{show.name}</p>
                    <p className="text-sm text-slate-400">{show.created_at}</p>
                  </div>
                  <div className="flex gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                    <span className="rounded-full border border-white/10 px-3 py-1">{show.is_active ? 'active' : 'ended'}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">{show.allow_signups ? 'signups on' : 'signups off'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
