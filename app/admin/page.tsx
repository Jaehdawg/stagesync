import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getAdminAccess } from '@/lib/admin-access'

export default async function AdminPage() {
  const supabase = await createClient()
  const liveAdminAccess = await getAdminAccess(supabase)

  if (liveAdminAccess) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">StageSync Admin</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Logged in as <span className="font-semibold">{liveAdminAccess?.username}</span>.
            </p>
            <form className="mt-4" action="/api/auth/logout" method="post">
              <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
                Log out
              </button>
            </form>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <Link href="/admin/bands" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
              <h2 className="text-lg font-semibold text-white">Manage bands</h2>
              <p className="mt-2 text-sm text-slate-300">CRUD bands and members.</p>
            </Link>
            <Link href="/admin/users" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
              <h2 className="text-lg font-semibold text-white">User management</h2>
              <p className="mt-2 text-sm text-slate-300">CRUD singers, band members, and admins.</p>
            </Link>
            <Link href="/admin/analytics" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
              <h2 className="text-lg font-semibold text-white">System analytics</h2>
              <p className="mt-2 text-sm text-slate-300">Track usage, queue volume, and show health.</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">StageSync Admin Login</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Admins sign in here with a username and password to manage bands, users, and analytics.
            </p>
          </header>
          <BandAccessForm
            role="admin"
            title="Admin login"
            description="Use your admin username and password to access system controls."
            submitLabel="Sign in"
            successMessage="Admin login successful."
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Switch to an admin account</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              You&apos;re currently signed in as a singer. Use an admin username and password to access the admin dashboard.
            </p>
          </header>
          <BandAccessForm
            role="admin"
            title="Admin login"
            description="Use your admin username and password to access system controls."
            submitLabel="Sign in"
            successMessage="Admin login successful."
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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">StageSync Admin</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Manage bands, users, and system analytics from one place.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/admin/bands" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
            <h2 className="text-lg font-semibold text-white">Manage bands</h2>
            <p className="mt-2 text-sm text-slate-300">CRUD bands and members.</p>
          </Link>
          <Link href="/admin/band-profiles" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
            <h2 className="text-lg font-semibold text-white">Band profiles</h2>
            <p className="mt-2 text-sm text-slate-300">Modify public band profile records.</p>
          </Link>
          <Link href="/admin/users" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
            <h2 className="text-lg font-semibold text-white">User management</h2>
            <p className="mt-2 text-sm text-slate-300">CRUD singers, band members, and admins.</p>
          </Link>
          <Link href="/admin/analytics" className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50 hover:bg-white/10">
            <h2 className="text-lg font-semibold text-white">System analytics</h2>
            <p className="mt-2 text-sm text-slate-300">Track usage, queue volume, and show health.</p>
          </Link>
        </section>
      </div>
    </main>
  )
}
