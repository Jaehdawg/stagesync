import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { AdminRowDialog } from '@/components/admin-row-dialog'
import { getAdminAccess } from '@/lib/admin-access'
import { adminCopy } from '@/content/en/admin'
import { listTestLogins } from '@/lib/test-login-list'
import { listBandRolesForProfileId } from '@/lib/band-roles'

type SearchParams = Record<string, string | string[] | undefined>

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function displayNameForUser(user: {
  display_name?: string | null
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}) {
  return user.display_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || user.email || 'Unknown user'
}

export default async function AdminUsersPage({
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
            <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.usersPage.title}</h1>
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
  const role = firstParam(params?.role)?.trim() ?? 'all'
  const page = Math.max(Number(firstParam(params?.page) ?? '1') || 1, 1)
  const pageSize = 10
  const offset = (page - 1) * pageSize
  const serviceSupabase = createServiceClient()

  let usersQuery = serviceSupabase
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, email, role, active_band_id, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })

  if (query) {
    usersQuery = usersQuery.or(
      `username.ilike.%${query}%,display_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
    )
  }

  if (role && role !== 'all') {
    usersQuery = usersQuery.eq('role', role)
  }

  const [{ data: liveUsers, count: liveUserCount }, { data: bands }] = await Promise.all([
    usersQuery.range(offset, offset + pageSize - 1),
    serviceSupabase.from('bands').select('id, band_name').order('band_name', { ascending: true }),
  ])

  const bandsById = new Map((bands ?? []).map((band) => [band.id, band]))
  const rolesByProfileId = new Map(
    await Promise.all(
      (liveUsers ?? []).map(async (user) => [user.id, await listBandRolesForProfileId(serviceSupabase, user.id)] as const)
    )
  )

  const bandOptions = bands ?? []
  const legacyLogins = await listTestLogins(supabase)
  const bandLogins = legacyLogins.filter((login) => login.role === 'band')

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.usersPage.title}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{adminCopy.usersPage.description}</p>
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
              <h2 className="text-2xl font-semibold text-white">{adminCopy.usersPage.liveTitle}</h2>
              <p className="mt-2 text-sm text-slate-300">{adminCopy.usersPage.liveDescription}</p>
            </div>
            <form method="get" className="flex flex-wrap items-center gap-3">
              <input
                name="q"
                defaultValue={query}
                placeholder={adminCopy.usersPage.searchPlaceholder}
                className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-white placeholder:text-slate-500"
              />
              <select name="role" defaultValue={role} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-white">
                <option value="all">{adminCopy.usersPage.allUsers}</option>
                <option value="singer">{adminCopy.usersPage.singers}</option>
                <option value="band">{adminCopy.usersPage.bandMembers}</option>
                <option value="admin">{adminCopy.usersPage.admins}</option>
              </select>
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">{adminCopy.usersPage.searchButton}</button>
            </form>
          </div>

          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action="/api/admin/users" method="post">
            <input type="hidden" name="action" value="create" />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.createModeLabel}</label>
              <select name="createMode" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                <option value="new_user">{adminCopy.usersPage.createModeNewUser}</option>
                <option value="existing_profile">{adminCopy.usersPage.createModeExistingProfile}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.roleLabel}</label>
              <select name="role" defaultValue="singer" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                <option value="singer">singer</option>
                <option value="band">band</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.profileLookupLabel}</label>
              <input name="profileLookup" list="live-profile-list" placeholder={adminCopy.usersPage.searchPlaceholder} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.usernameLabel}</label>
              <input name="username" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.displayNameLabel}</label>
              <input name="displayName" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.firstNameLabel}</label>
              <input name="firstName" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.lastNameLabel}</label>
              <input name="lastName" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.emailLabel}</label>
              <input name="email" type="email" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.passwordLabel}</label>
              <input name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.bandLabel}</label>
              <input name="bandLookup" list="live-band-list" placeholder={adminCopy.bandsPage.searchPlaceholder} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">{adminCopy.usersPage.bandRoleLabel}</label>
              <select name="bandRole" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                <option value="member">{adminCopy.usersPage.bandRoleMember}</option>
                <option value="admin">{adminCopy.usersPage.bandRoleAdmin}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{adminCopy.usersPage.saveUser}</button>
            </div>
            <datalist id="live-band-list">
              {bandOptions.map((band) => (
                <option key={band.id} value={band.band_name}>
                  {band.band_name}
                </option>
              ))}
            </datalist>
            <datalist id="live-profile-list">
              {(liveUsers ?? []).map((user) => (
                <option key={user.id} value={user.username ?? user.display_name ?? user.id}>
                  {displayNameForUser(user)}
                </option>
              ))}
            </datalist>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(liveUsers ?? []).map((user) => {
              const userRoles = rolesByProfileId.get(user.id) ?? []
              return (
                <article key={user.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{displayNameForUser(user)}</h3>
                      <p className="text-sm text-slate-400">@{user.username ?? 'unknown'}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{user.role ?? 'unknown'}</p>
                      {user.email ? <p className="mt-1 text-sm text-slate-300">{user.email}</p> : null}
                      {user.active_band_id ? <p className="mt-1 text-xs text-cyan-200">Active band: {bandsById.get(user.active_band_id)?.band_name ?? user.active_band_id}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {userRoles.map((roleRow) => {
                          const bandName = bandsById.get(roleRow.band_id)?.band_name ?? roleRow.band_id
                          return (
                            <span key={roleRow.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                              {bandName} · {roleRow.band_role}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AdminRowDialog triggerLabel="Edit" title={`Edit ${displayNameForUser(user)}`}>
                        <form className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5" action="/api/admin/users" method="post">
                          <input type="hidden" name="action" value="update" />
                          <input type="hidden" name="profileId" value={user.id} />
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">Username</label>
                            <input name="username" defaultValue={user.username ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">Display name</label>
                            <input name="displayName" defaultValue={user.display_name ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">First name</label>
                            <input name="firstName" defaultValue={user.first_name ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">Last name</label>
                            <input name="lastName" defaultValue={user.last_name ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">Email</label>
                            <input name="email" defaultValue={user.email ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">Role</label>
                            <select name="role" defaultValue={user.role ?? 'singer'} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                              <option value="singer">singer</option>
                              <option value="band">band</option>
                              <option value="admin">admin</option>
                            </select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-200">Add band</label>
                            <input name="bandLookup" list="live-band-list" placeholder="search band" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-200">Band role</label>
                            <select name="bandRole" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                              <option value="member">member</option>
                              <option value="admin">admin</option>
                            </select>
                          </div>
                          <div>
                            <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save changes</button>
                          </div>
                        </form>

                        <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">{adminCopy.usersPage.bandMemberships}</h4>
                          <div className="space-y-2">
                            {userRoles.length ? userRoles.map((roleRow) => (
                              <div key={roleRow.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                                <span>{bandsById.get(roleRow.band_id)?.band_name ?? roleRow.band_id} · {roleRow.band_role}</span>
                                <form action="/api/admin/users" method="post">
                                  <input type="hidden" name="action" value="remove-role" />
                                  <input type="hidden" name="profileId" value={user.id} />
                                  <input type="hidden" name="bandLookup" value={bandsById.get(roleRow.band_id)?.band_name ?? roleRow.band_id} />
                                  <button type="submit" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">Remove</button>
                                </form>
                              </div>
                            )) : <p className="text-sm text-slate-400">{adminCopy.usersPage.noBandMemberships}</p>}
                          </div>
                        </div>
                      </AdminRowDialog>
                      <form action="/api/admin/users" method="post">
                        <input type="hidden" name="action" value="delete" />
                        <input type="hidden" name="profileId" value={user.id} />
                        <button type="submit" className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">Delete</button>
                      </form>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-400">
            <p>Page {page} of {Math.max(Math.ceil((liveUserCount ?? 0) / pageSize), 1)}</p>
            <div className="flex gap-2">
              {page > 1 ? <Link href={`/admin/users?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}${role !== 'all' ? `&role=${encodeURIComponent(role)}` : ''}`} className="rounded-full border border-white/10 px-4 py-2 text-white">Previous</Link> : null}
              {(liveUserCount ?? 0) > offset + pageSize ? <Link href={`/admin/users?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}${role !== 'all' ? `&role=${encodeURIComponent(role)}` : ''}`} className="rounded-full border border-white/10 px-4 py-2 text-white">Next</Link> : null}
            </div>
          </div>
        </section>


        <section className="grid gap-4 md:grid-cols-2">
          {bandLogins.map((login) => (
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
