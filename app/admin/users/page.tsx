import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getTestSession } from '@/lib/test-session'
import { listTestLogins } from '@/lib/test-login-list'
import { AdminRowDialog } from '@/components/admin-row-dialog'

export default async function AdminUsersPage() {
  const testSession = await getTestSession()
  const supabase = await createClient()

  if (testSession?.role !== 'admin') {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">User management</h1>
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

  const logins = await listTestLogins(supabase)

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">User management</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Create, update, and delete test singers, band members, and admins.</p>
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

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Create user</h2>
          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-4" action="/api/testing/logins" method="post">
            <input type="hidden" name="action" value="upsert" />
            <div className="space-y-2">
              <label htmlFor="create-username" className="text-sm font-medium text-slate-200">Username</label>
              <input id="create-username" name="username" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label htmlFor="create-role" className="text-sm font-medium text-slate-200">Role</label>
              <select id="create-role" name="role" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                <option value="singer">singer</option>
                <option value="band">band</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="create-password" className="text-sm font-medium text-slate-200">Password</label>
              <input id="create-password" name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label htmlFor="create-band" className="text-sm font-medium text-slate-200">Band name</label>
              <input id="create-band" name="bandName" type="text" placeholder="Neon Echo" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="md:col-span-4">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save user</button>
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {logins.map((login) => (
            <article key={login.username} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">{login.username}</h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{login.role}</p>
                  {login.band_name ? <p className="text-xs text-cyan-200">Band: {login.band_name}</p> : null}
                </div>
                <div className="flex gap-2">
                  <AdminRowDialog triggerLabel="Edit" title={`Edit ${login.username}`}>
                    <form className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5" action="/api/testing/logins" method="post">
                      <input type="hidden" name="action" value="upsert" />
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200" htmlFor={`username-${login.username}`}>Username</label>
                        <input id={`username-${login.username}`} name="username" defaultValue={login.username} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200" htmlFor={`role-${login.username}`}>Role</label>
                        <select id={`role-${login.username}`} name="role" defaultValue={login.role} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                          <option value="singer">singer</option>
                          <option value="band">band</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200" htmlFor={`password-${login.username}`}>Password</label>
                        <input id={`password-${login.username}`} name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200" htmlFor={`band-${login.username}`}>Band name</label>
                        <input id={`band-${login.username}`} name="bandName" defaultValue={login.band_name ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                      </div>
                      <div>
                        <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save changes</button>
                      </div>
                    </form>
                  </AdminRowDialog>
                  <form action="/api/testing/logins" method="post">
                    <input type="hidden" name="action" value="delete" />
                    <input type="hidden" name="username" value={login.username} />
                    <button type="submit" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">Delete</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
