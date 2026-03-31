import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getTestSession } from '@/lib/test-session'
import { listTestBandProfiles } from '@/lib/test-band-profile'

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

  const bandProfiles = await listTestBandProfiles(supabase)

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Platform control</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Manage bands</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Create, edit, and delete test band profiles.</p>
            </div>
            <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">
              Back to admin
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Create band</h2>
          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action="/api/testing/band-profiles" method="post">
            <input type="hidden" name="action" value="create" />
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="create-band-name" className="text-sm font-medium text-slate-200">Band name</label>
              <input id="create-band-name" name="bandName" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="create-band-message" className="text-sm font-medium text-slate-200">Custom message</label>
              <textarea id="create-band-message" name="customMessage" rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Create band</button>
            </div>
          </form>
        </section>

        <section className="grid gap-4">
          {bandProfiles.map((profile) => (
            <article key={profile.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{profile.band_name}</h2>
                  <p className="mt-1 text-sm text-slate-400">Profile ID: {profile.id}</p>
                </div>
                <form action={`/api/testing/band-profiles/${profile.id}`} method="post" className="flex gap-2">
                  <input type="hidden" name="action" value="delete" />
                  <button type="submit" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">Delete</button>
                </form>
              </div>

              <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action={`/api/testing/band-profiles/${profile.id}`} method="post">
                <input type="hidden" name="action" value="update" />
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor={`band-name-${profile.id}`}>Band name</label>
                  <input id={`band-name-${profile.id}`} name="bandName" defaultValue={profile.band_name} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor={`band-message-${profile.id}`}>Custom message</label>
                  <textarea id={`band-message-${profile.id}`} name="customMessage" defaultValue={profile.custom_message ?? ''} rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save band</button>
                </div>
              </form>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
