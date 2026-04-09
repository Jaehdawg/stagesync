import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { AdminRowDialog } from '@/components/admin-row-dialog'
import { getAdminAccess } from '@/lib/admin-access'
import { listTestLogins } from '@/lib/test-login-list'
import type { BandRoleWithProfile } from '@/lib/band-roles'
import { adminCopy } from '@/content/en/admin'

type SearchParams = Record<string, string | string[] | undefined>

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminBandsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const liveAdminAccess = await getAdminAccess(supabase)

  if (!liveAdminAccess) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.bandsPage.title}</h1>
            <p className="mt-3 max-w-2xl text-slate-300">{adminCopy.login.pageDescription}</p>
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

  const params = await searchParams
  const query = firstParam(params?.q)?.trim() ?? ''
  const page = Math.max(Number(firstParam(params?.page) ?? '1') || 1, 1)
  const pageSize = 10
  const offset = (page - 1) * pageSize
  const serviceSupabase = createServiceClient()
  let bandQuery = serviceSupabase
    .from('bands')
    .select('id, band_name, created_at', { count: 'exact' })
    .order('band_name', { ascending: true })

  if (query) {
    bandQuery = bandQuery.ilike('band_name', `%${query}%`)
  }

  const { data: liveBands, count: liveBandCount } = await bandQuery.range(offset, offset + pageSize - 1)
  const liveBandIds = (liveBands ?? []).map((band) => band.id)
  const [bandProfilesResult, bandRolesResult] = liveBandIds.length
    ? await Promise.all([
        serviceSupabase
          .from('band_profiles')
          .select('id, band_name, website_url, facebook_url, instagram_url, tiktok_url, paypal_url, venmo_url, cashapp_url, custom_message, logo_url, created_at, band_id')
          .in('band_id', liveBandIds),
        serviceSupabase
          .from('band_roles')
          .select('id, band_id, profile_id, band_role, active, created_at, updated_at')
          .in('band_id', liveBandIds)
          .order('band_role', { ascending: true })
          .order('created_at', { ascending: true }),
      ])
    : [{ data: [], error: null }, { data: [], error: null }]

  if (bandProfilesResult.error) {
    throw new Error(bandProfilesResult.error.message)
  }
  if (bandRolesResult.error) {
    throw new Error(bandRolesResult.error.message)
  }

  const bandRoles = (bandRolesResult.data ?? []) as BandRoleWithProfile[]
  const profileIds = [...new Set(bandRoles.map((role) => role.profile_id))]
  const profiles = profileIds.length
    ? (await serviceSupabase
        .from('profiles')
        .select('id, username, display_name, first_name, last_name, role')
        .in('id', profileIds)).data ?? []
    : []

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  const rolesByBandId = new Map<string, BandRoleWithProfile[]>()
  for (const role of bandRoles) {
    const current = rolesByBandId.get(role.band_id) ?? []
    current.push({ ...role, profile: (profilesById.get(role.profile_id) as BandRoleWithProfile['profile']) ?? null })
    rolesByBandId.set(role.band_id, current)
  }

  const bandProfilesById = new Map((bandProfilesResult.data ?? []).map((profile) => [profile.band_id, profile]))
  const liveBandDetails = liveBandIds.map((bandId) => ({
    bandId,
    profile: bandProfilesById.get(bandId) ?? null,
    roles: rolesByBandId.get(bandId) ?? [],
  }))
  const liveBandDetailsById = new Map(liveBandDetails.map((item) => [item.bandId, item]))
  const profileSearch = query
    ? await serviceSupabase
        .from('profiles')
        .select('id, username, display_name, first_name, last_name, role')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .order('display_name', { ascending: true })
        .limit(20)
    : await serviceSupabase.from('profiles').select('id, username, display_name, first_name, last_name, role').order('display_name', { ascending: true }).limit(20)

  const liveProfiles = profileSearch.data ?? []
  const bandLogins = (await listTestLogins(supabase)).filter((login) => login.role === 'band')

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
                <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.bandsPage.title}</h1>
                <p className="mt-3 max-w-2xl text-slate-300">{adminCopy.bandsPage.description}</p>
              </div>
              <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">
                {adminCopy.backToAdmin}
              </Link>
            </div>
            <form className="mt-4" action="/api/auth/logout" method="post">
              <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
                {adminCopy.logoutLabel}
              </button>
            </form>
          </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">{adminCopy.bandsPage.liveTitle}</h2>
              <p className="mt-2 text-sm text-slate-300">{adminCopy.bandsPage.liveDescription}</p>
            </div>
            <form method="get" className="flex flex-wrap items-center gap-3">
              <input
                name="q"
                defaultValue={query}
                placeholder={adminCopy.bandsPage.searchPlaceholder}
                className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-white placeholder:text-slate-500"
              />
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">{adminCopy.bandsPage.searchButton}</button>
            </form>
          </div>

          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action="/api/admin/bands" method="post">
            <input type="hidden" name="action" value="create" />
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.bandNameLabel}</label>
              <input name="bandName" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.createModeLabel}</label>
              <select name="createMode" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                <option value="existing_profile">{adminCopy.bandsPage.createModeExisting}</option>
                <option value="new_user">{adminCopy.bandsPage.createModeNewUser}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.bandRoleLabel}</label>
              <select name="bandRole" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                <option value="admin">{adminCopy.bandsPage.bandRoleAdmin}</option>
                <option value="member">{adminCopy.bandsPage.bandRoleMember}</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.existingProfileLabel}</label>
              <input list="live-profile-list" name="profileLookup" placeholder={adminCopy.bandsPage.profileSearchPlaceholder} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.firstNameLabel}</label>
              <input name="firstName" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.lastNameLabel}</label>
              <input name="lastName" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.emailLabel}</label>
              <input name="email" type="email" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.passwordLabel}</label>
              <input name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.usernameLabel}</label>
              <input name="username" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.customMessageLabel}</label>
              <textarea name="customMessage" rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.websiteLabel}</label>
              <input name="websiteUrl" type="url" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.facebookLabel}</label>
              <input name="facebookUrl" type="url" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.instagramLabel}</label>
              <input name="instagramUrl" type="url" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.tiktokLabel}</label>
              <input name="tiktokUrl" type="url" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.paypalLabel}</label>
              <input name="paypalUrl" type="url" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.venmoLabel}</label>
              <input name="venmoUrl" type="url" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.cashappLabel}</label>
              <input name="cashappUrl" type="url" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{adminCopy.bandsPage.createButton}</button>
            </div>
            <datalist id="live-profile-list">
              {liveProfiles.map((profile) => (
                <option key={profile.id} value={profile.username ?? profile.display_name ?? profile.id ?? ''}>
                  {profile.display_name || profile.username || profile.role || 'Profile'}
                </option>
              ))}
            </datalist>
          </form>

          <div className="mt-6 grid gap-4">
            {liveBands?.map((band) => {
              const bandDetail = liveBandDetailsById.get(band.id)
              const bandProfile = bandDetail?.profile ?? null
              const bandRoles = bandDetail?.roles ?? []
              return (
                <article key={band.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{band.band_name}</h3>
                      <p className="text-sm text-slate-400">{adminCopy.bandsPage.bandIdLabel}: {band.id}</p>
                      <p className="mt-2 text-sm text-slate-300">{bandProfile?.custom_message ?? adminCopy.bandsPage.noCustomMessage}</p>
                    </div>
                    <div className="flex gap-2">
                      <AdminRowDialog triggerLabel={adminCopy.bandsPage.edit} title={`Edit ${band.band_name}`}>
                        <form className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5" action={`/api/admin/bands/${band.id}`} method="post">
                          <input type="hidden" name="action" value="update" />
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.bandNameLabel}</label>
                            <input name="bandName" defaultValue={band.band_name} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.customMessageLabel}</label>
                            <textarea name="customMessage" defaultValue={bandProfile?.custom_message ?? ''} rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.websiteLabel}</label>
                            <input name="websiteUrl" defaultValue={bandProfile?.website_url ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.facebookLabel}</label>
                            <input name="facebookUrl" defaultValue={bandProfile?.facebook_url ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.instagramLabel}</label>
                            <input name="instagramUrl" defaultValue={bandProfile?.instagram_url ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.tiktokLabel}</label>
                            <input name="tiktokUrl" defaultValue={bandProfile?.tiktok_url ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.paypalLabel}</label>
                            <input name="paypalUrl" defaultValue={bandProfile?.paypal_url ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.venmoLabel}</label>
                            <input name="venmoUrl" defaultValue={bandProfile?.venmo_url ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-200">{adminCopy.bandsPage.cashappLabel}</label>
                            <input name="cashappUrl" defaultValue={bandProfile?.cashapp_url ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="md:col-span-2">
                            <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{adminCopy.bandsPage.saveChanges}</button>
                          </div>
                        </form>
                      </AdminRowDialog>
                      <form action={`/api/admin/bands/${band.id}`} method="post">
                        <input type="hidden" name="action" value="delete" />
                        <button type="submit" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">{adminCopy.bandsPage.delete}</button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr]">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">{adminCopy.bandsPage.membersTitle}</h4>
                      <div className="mt-3 space-y-2">
                        {bandRoles.length ? bandRoles.map((role) => (
                          <div key={role.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
                            <div>
                              <p className="font-medium text-white">{role.profile?.display_name || role.profile?.username || role.profile_id}</p>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{role.band_role}</p>
                            </div>
                            <form action={`/api/admin/bands/${band.id}`} method="post">
                              <input type="hidden" name="action" value="remove-role" />
                              <input type="hidden" name="profileId" value={role.profile_id} />
                              <button type="submit" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">{adminCopy.bandsPage.remove}</button>
                            </form>
                          </div>
                            )) : <p className="text-sm text-slate-400">{adminCopy.bandsPage.bandMembersEmpty}</p>}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">{adminCopy.bandsPage.addMemberTitle}</h4>
                      <form action={`/api/admin/bands/${band.id}`} method="post" className="mt-3 grid gap-3">
                        <input type="hidden" name="action" value="add-role" />
                        <input name="profileLookup" list="live-profile-list" placeholder={adminCopy.bandsPage.profileSearchPlaceholder} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500" />
                        <select name="bandRole" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white">
                          <option value="member">{adminCopy.bandsPage.bandRoleMember}</option>
                          <option value="admin">{adminCopy.bandsPage.bandRoleAdmin}</option>
                        </select>
                        <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{adminCopy.bandsPage.attachToBand}</button>
                      </form>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-400">
            <p>Page {page} of {Math.max(Math.ceil((liveBandCount ?? 0) / pageSize), 1)}</p>
            <div className="flex gap-2">
              {page > 1 ? <Link href={`/admin/bands?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`} className="rounded-full border border-white/10 px-4 py-2 text-white">{adminCopy.bandsPage.previous}</Link> : null}
              {(liveBandCount ?? 0) > offset + pageSize ? <Link href={`/admin/bands?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`} className="rounded-full border border-white/10 px-4 py-2 text-white">{adminCopy.bandsPage.next}</Link> : null}
            </div>
          </div>
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
                  <AdminRowDialog triggerLabel={adminCopy.bandsPage.edit} title={`Edit ${login.username}`}>
                    <form className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5" action="/api/testing/logins" method="post">
                      <input type="hidden" name="action" value="upsert" />
                      <input type="hidden" name="role" value="band" />
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200" htmlFor={`band-username-${login.username}`}>{adminCopy.bandsPage.usernameLabel}</label>
                        <input id={`band-username-${login.username}`} name="username" defaultValue={login.username} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200" htmlFor={`band-password-${login.username}`}>{adminCopy.bandsPage.passwordLabel}</label>
                        <input id={`band-password-${login.username}`} name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200" htmlFor={`band-name-${login.username}`}>{adminCopy.bandsPage.bandNameLabel}</label>
                        <input id={`band-name-${login.username}`} name="bandName" defaultValue={login.band_name ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                      </div>
                      <div>
                        <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{adminCopy.bandsPage.saveChanges}</button>
                      </div>
                    </form>
                  </AdminRowDialog>
                  <form action="/api/testing/logins" method="post">
                    <input type="hidden" name="action" value="delete" />
                    <input type="hidden" name="username" value={login.username} />
                    <button type="submit" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">{adminCopy.bandsPage.delete}</button>
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
