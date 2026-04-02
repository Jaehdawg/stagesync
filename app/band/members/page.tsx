import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { AdminRowDialog } from '@/components/admin-row-dialog'
import { getTestSession } from '@/lib/test-session'
import { getTestLogin } from '@/lib/test-login-list'
import { listTestLogins } from '@/lib/test-login-list'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { listBandRolesWithProfilesForBandId } from '@/lib/band-roles'

function LoginCard({ title, description }: { title: string; description: string }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{title}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">{description}</p>
        </header>
        <BandAccessForm role="band" title="Band login" description="Use your band username and password to access show controls." submitLabel="Sign in" successMessage="Band login successful." />
      </div>
    </main>
  )
}

function AccessDenied({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Band members</h1>
          <p className="mt-3 max-w-2xl text-slate-300">{message}</p>
        </header>
      </div>
    </main>
  )
}

export default async function BandMembersPage() {
  const testSession = await getTestSession()
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  if (testSession?.role === 'band') {
    const current = await getTestLogin(supabase, testSession.username)
    if (current?.band_access_level === 'admin') {
      const logins = await listTestLogins(supabase)
      const members = logins.filter((login) => login.role === 'band' && login.active_band_id === testSession?.activeBandId && login.username !== current.username)

      return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
                  <h1 className="mt-2 text-4xl font-semibold text-white">Band members</h1>
                  <p className="mt-3 max-w-2xl text-slate-300">Create, edit, and delete members for {current.band_name}.</p>
                </div>
                <Link href="/band" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">Back to band dashboard</Link>
              </div>
            </header>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Create member</h2>
              <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-4" action="/api/band/members" method="post">
                <input type="hidden" name="action" value="upsert" />
                <input type="hidden" name="bandName" value={current.band_name ?? ''} />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="member-username">Username</label>
                  <input id="member-username" name="username" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="member-password">Password</label>
                  <input id="member-password" name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-200">Band</label>
                  <div className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white">{current.band_name}</div>
                </div>
                <div className="md:col-span-4">
                  <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Create member</button>
                </div>
              </form>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              {members.map((member) => (
                <article key={member.username} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{member.username}</h2>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">member</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </div>
        </main>
      )
    }

    const liveAccess = await getLiveBandAccessContext(serviceSupabase, { requireAdmin: true })
    if (liveAccess) {
      const roles = await listBandRolesWithProfilesForBandId(serviceSupabase, liveAccess.bandId)
      const members = roles.filter((role) => role.profile_id !== liveAccess.userId)

      return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
                  <h1 className="mt-2 text-4xl font-semibold text-white">Band members</h1>
                  <p className="mt-3 max-w-2xl text-slate-300">Create, edit, and delete members for {liveAccess.bandName}.</p>
                </div>
                <Link href="/band" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">Back to band dashboard</Link>
              </div>
            </header>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Create member</h2>
              <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-4" action="/api/band/members" method="post">
                <input type="hidden" name="action" value="upsert" />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="member-username">Username</label>
                  <input id="member-username" name="username" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="member-password">Password</label>
                  <input id="member-password" name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-200">Band</label>
                  <div className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white">{liveAccess.bandName}</div>
                </div>
                <div className="md:col-span-4">
                  <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Create member</button>
                </div>
              </form>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              {members.map((member) => (
                <article key={member.profile?.username ?? member.profile_id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{member.profile?.username ?? member.profile_id}</h2>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{member.band_role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </div>
        </main>
      )
    }

    return <AccessDenied message="Band admin access required." />
  }

  const liveAccess = await getLiveBandAccessContext(serviceSupabase, { requireAdmin: true })
  if (!liveAccess) {
    return <LoginCard title="Band members" description="Band login required." />
  }

  const roles = await listBandRolesWithProfilesForBandId(serviceSupabase, liveAccess.bandId)
  const members = roles.filter((role) => role.profile_id !== liveAccess.userId)

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Band members</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Create, edit, and delete members for {liveAccess.bandName}.</p>
            </div>
            <Link href="/band" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">Back to band dashboard</Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Create member</h2>
          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-4" action="/api/band/members" method="post">
            <input type="hidden" name="action" value="upsert" />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="member-username">Username</label>
              <input id="member-username" name="username" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="member-password">Password</label>
              <input id="member-password" name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">Band</label>
              <div className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white">{liveAccess.bandName}</div>
            </div>
            <div className="md:col-span-4">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Create member</button>
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <article key={member.profile?.username ?? member.profile_id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">{member.profile?.username ?? member.profile_id}</h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{member.band_role}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
