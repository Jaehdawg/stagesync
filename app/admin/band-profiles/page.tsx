import Link from 'next/link'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { getAdminAccess } from '@/lib/admin-access'
import { AdminRowDialog } from '@/components/admin-row-dialog'
import { adminCopy } from '@/content/en/admin'

export default async function AdminBandProfilesPage() {
  const supabase = createServiceClient()
  const liveAdminAccess = await getAdminAccess(supabase)

  if (!liveAdminAccess) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.bandProfilesPage.title}</h1>
            <p className="mt-3 max-w-2xl text-slate-300">{adminCopy.bandProfilesPage.description}</p>
          </header>
          <BandAccessForm role="admin" title={adminCopy.login.title} description={adminCopy.login.description} submitLabel={adminCopy.login.submitLabel} successMessage={adminCopy.login.successMessage} endpoint="/api/auth/login" />
        </div>
      </main>
    )
  }

  const { data: bandProfiles } = await supabase
    .from('band_profiles')
    .select('id, profile_id, band_name, logo_url, website_url, facebook_url, instagram_url, tiktok_url, paypal_url, venmo_url, cashapp_url, custom_message, updated_at')
    .order('updated_at', { ascending: false })

  const { data: profiles } = await supabase.from('profiles').select('id, username, display_name, role').order('updated_at', { ascending: false })
  const safeBandProfiles = bandProfiles ?? []
  const safeProfiles = profiles ?? []

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.bandProfilesPage.title}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{adminCopy.bandProfilesPage.description}</p>
            </div>
            <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">{adminCopy.bandProfilesPage.backToAdmin}</Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">{adminCopy.bandProfilesPage.createTitle}</h2>
          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action="/api/admin/band-profiles" method="post">
            <input type="hidden" name="action" value="create" />
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandProfilesPage.profileLabel}</label>
              <select name="profileId" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                <option value="">{adminCopy.bandProfilesPage.selectProfile}</option>
                {safeProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.display_name || profile.username} ({profile.role})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandProfilesPage.bandNameLabel}</label>
              <input name="bandName" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandProfilesPage.customMessageLabel}</label>
              <textarea name="customMessage" rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{adminCopy.bandProfilesPage.createButton}</button>
            </div>
          </form>
        </section>

        <section className="grid gap-4">
          {safeBandProfiles.map((profile) => (
            <article key={profile.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{profile.band_name}</h2>
                  <p className="text-sm text-slate-400">{adminCopy.bandProfilesPage.profileIdLabel}: {profile.profile_id}</p>
                </div>
                <div className="flex gap-2">
                  <AdminRowDialog triggerLabel={adminCopy.bandProfilesPage.edit} title={`Edit ${profile.band_name}`}>
                    <form className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5" action={`/api/admin/band-profiles/${profile.id}`} method="post">
                      <input type="hidden" name="action" value="update" />
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-200">{adminCopy.bandProfilesPage.bandNameLabel}</label>
                        <input name="bandName" defaultValue={profile.band_name} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-200">{adminCopy.bandProfilesPage.customMessageLabel}</label>
                        <textarea name="customMessage" defaultValue={profile.custom_message ?? ''} rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{adminCopy.bandProfilesPage.saveChanges}</button>
                      </div>
                    </form>
                  </AdminRowDialog>
                  <form action={`/api/admin/band-profiles/${profile.id}`} method="post">
                    <input type="hidden" name="action" value="delete" />
                    <button type="submit" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">{adminCopy.bandProfilesPage.delete}</button>
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
