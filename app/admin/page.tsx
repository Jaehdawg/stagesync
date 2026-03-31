import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getTestSession } from '@/lib/test-session'
import { listSeedTestLogins } from '@/lib/test-login'
import { listTestLogins } from '@/lib/test-login-list'
import { getLatestTestBandProfile } from '@/lib/test-band-profile'
import { listTestBandProfiles } from '@/lib/test-band-profile-list'

export default async function AdminPage() {
  const testSession = await getTestSession()
  const supabase = await createClient()

  if (testSession?.role === 'admin') {
    const testLogins = await listTestLogins(supabase)
    const logins = testLogins.length ? testLogins : listSeedTestLogins()
    const testBandProfile = (await listTestBandProfiles(supabase)).length
      ? await getLatestTestBandProfile(supabase)
      : await getLatestTestBandProfile(supabase)

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">StageSync Admin</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Logged in as testing account <span className="font-semibold">{testSession.username}</span>.
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

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-white">Test user management</h2>
            <p className="mt-2 text-sm text-slate-300">Create, update, or delete seeded band/admin accounts for testing.</p>

            <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-4" action="/api/testing/logins" method="post">
              <input type="hidden" name="action" value="upsert" />
              <div className="space-y-2">
                <label htmlFor="new-username" className="text-sm font-medium text-slate-200">Username</label>
                <input id="new-username" name="username" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
              </div>
              <div className="space-y-2">
                <label htmlFor="new-role" className="text-sm font-medium text-slate-200">Role</label>
                <select id="new-role" name="role" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                  <option value="band">band</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-slate-200">Password</label>
                <input id="new-password" name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save user</button>
              </div>
            </form>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {logins.map((login) => (
                <div key={login.username} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{login.username}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{login.role}</p>
                    </div>
                    <form action="/api/testing/logins" method="post">
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="username" value={login.username} />
                      <button type="submit" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">Delete</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-white">Test band profile</h2>
            <p className="mt-2 text-sm text-slate-300">Manage the seeded band profile used by the band dashboard.</p>

            <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action="/api/testing/band-profiles" method="post">
              <input type="hidden" name="action" value="upsert" />
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="band-name" className="text-sm font-medium text-slate-200">Band name</label>
                <input id="band-name" name="bandName" type="text" defaultValue={testBandProfile?.band_name ?? 'StageSync'} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="band-message" className="text-sm font-medium text-slate-200">Custom message</label>
                <textarea id="band-message" name="customMessage" defaultValue={testBandProfile?.custom_message ?? ''} rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save band profile</button>
              </div>
            </form>

            <form className="mt-4" action="/api/testing/band-profiles" method="post">
              <input type="hidden" name="action" value="delete" />
              <button type="submit" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">Delete latest band profile</button>
            </form>
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
