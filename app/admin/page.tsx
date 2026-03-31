import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'

export default async function AdminPage() {
  const supabase = await createClient()

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
          />
        </div>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

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
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">Manage bands</h2>
            <p className="mt-2 text-sm text-slate-300">CRUD bands and members.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">User management</h2>
            <p className="mt-2 text-sm text-slate-300">CRUD singers, band members, and admins.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">System analytics</h2>
            <p className="mt-2 text-sm text-slate-300">Track usage, queue volume, and show health.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
