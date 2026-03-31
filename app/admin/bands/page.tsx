import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getTestSession } from '@/lib/test-session'
import { listTestLogins } from '@/lib/test-login-list'
import { AdminRowDialog } from '@/components/admin-row-dialog'

export default async function AdminBandsPage() {
  const testSession = await getTestSession()
  const supabase = await createClient()

  if (testSession?.role !== 'admin') {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Manage bands</h1>
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

  const bandLogins = (await listTestLogins(supabase)).filter((login) => login.role === 'band')

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
                <h1 className="mt-2 text-4xl font-semibold text-white">Manage bands</h1>
                <p className="mt-3 max-w-2xl text-slate-300">Create, edit, and delete band login accounts.</p>
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
          <h2 className="text-2xl font-semibold text-white">Create band</h2>
          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-4" action="/api/testing/logins" method="post">
            <input type="hidden" name="action" value="upsert" />
            <input type="hidden" name="role" value="band" />
            <div className="space-y-2">
              <label htmlFor="create-band-username" className="text-sm font-medium text-slate-200">Username</label>
              <input id="create-band-username" name="username" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label htmlFor="create-band-password" className="text-sm font-medium text-slate-200">Password</label>
              <input id="create-band-password" name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label htmlFor="create-band-name" className="text-sm font-medium text-slate-200">Band name</label>
              <input id="create-band-name" name="bandName" type="text" placeholder="Neon Echo" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Create band</button>
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {bandLogins.map((login) => (
            <article key={login.username} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">{login.band_name || login.username}</h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{login.username}</p>
                </div>
                <div className="flex gap-2">
                  <AdminRowDialog triggerLabel="Edit" title={`Edit ${login.username}`}>
                    <form className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5" action="/api/testing/logins" method="post">
                      <input type="hidden" name="action" value="upsert" />
                      <input type="hidden" name="role" value="band" />
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200" htmlFor={`band-username-${login.username}`}>Username</label>
                        <input id={`band-username-${login.username}`} name="username" defaultValue={login.username} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200" htmlFor={`band-password-${login.username}`}>Password</label>
                        <input id={`band-password-${login.username}`} name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200" htmlFor={`band-name-${login.username}`}>Band name</label>
                        <input id={`band-name-${login.username}`} name="bandName" defaultValue={login.band_name ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
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
