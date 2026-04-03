import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getAdminAccess } from '@/lib/admin-access'
import { adminCopy } from '@/content/en/admin'

export default async function AdminPage() {
  const supabase = await createClient()
  const liveAdminAccess = await getAdminAccess(supabase)

  if (liveAdminAccess) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.dashboardTitle}</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Logged in as <span className="font-semibold">{liveAdminAccess?.username}</span>.
            </p>
            <form className="mt-4" action="/api/auth/logout" method="post">
              <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
                {adminCopy.logoutLabel}
              </button>
            </form>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <Link href="/admin/bands" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
              <h2 className="text-lg font-semibold text-white">{adminCopy.cards.bands.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{adminCopy.cards.bands.description}</p>
            </Link>
            <Link href="/admin/users" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
              <h2 className="text-lg font-semibold text-white">{adminCopy.cards.users.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{adminCopy.cards.users.description}</p>
            </Link>
            <Link href="/admin/analytics" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
              <h2 className="text-lg font-semibold text-white">{adminCopy.cards.analytics.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{adminCopy.cards.analytics.description}</p>
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.login.pageTitle}</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              {adminCopy.login.pageDescription}
            </p>
          </header>
          <BandAccessForm
            role="admin"
            title={adminCopy.login.title}
            description={adminCopy.login.description}
            submitLabel={adminCopy.login.submitLabel}
            successMessage={adminCopy.login.successMessage}
            endpoint="/api/auth/login"
          />
        </div>
      </main>
    )
  }

  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    : { data: { role: 'admin' } }

  if (profile?.role !== 'admin') {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.login.switchTitle}</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              {adminCopy.login.switchMessage}
            </p>
          </header>
          <BandAccessForm
            role="admin"
            title={adminCopy.login.title}
            description={adminCopy.login.description}
            submitLabel={adminCopy.login.submitLabel}
            successMessage={adminCopy.login.successMessage}
            endpoint="/api/auth/login"
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.dashboardTitle}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            {adminCopy.dashboardDescription}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/admin/bands" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
            <h2 className="text-lg font-semibold text-white">{adminCopy.cards.bands.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{adminCopy.cards.bands.description}</p>
          </Link>
          <Link href="/admin/band-profiles" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
            <h2 className="text-lg font-semibold text-white">{adminCopy.cards.bandProfiles.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{adminCopy.cards.bandProfiles.description}</p>
          </Link>
          <Link href="/admin/users" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
            <h2 className="text-lg font-semibold text-white">{adminCopy.cards.users.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{adminCopy.cards.users.description}</p>
          </Link>
          <Link href="/admin/analytics" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
            <h2 className="text-lg font-semibold text-white">{adminCopy.cards.analytics.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{adminCopy.cards.analytics.description}</p>
          </Link>
        </section>
      </div>
    </main>
  )
}
