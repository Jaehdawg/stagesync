import type { SupabaseClient } from '@supabase/supabase-js'

export type BandRole = {
  id: string
  band_id: string
  profile_id: string
  band_role: 'admin' | 'member'
  active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type BandRoleWithProfile = BandRole & {
  profile?: {
    id: string
    username: string | null
    display_name: string | null
    first_name: string | null
    last_name: string | null
    role: string | null
  } | null
}

export async function listBandRolesForBandId(supabase: SupabaseClient<any>, bandId: string) {
  const { data, error } = await supabase
    .from('band_roles')
    .select('id, band_id, profile_id, band_role, active, created_at, updated_at')
    .eq('band_id', bandId)
    .order('band_role', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as BandRole[]
}

export async function listBandRolesWithProfilesForBandId(supabase: SupabaseClient<any>, bandId: string) {
  const roles = await listBandRolesForBandId(supabase, bandId)
  const profileIds = [...new Set(roles.map((role) => role.profile_id))]

  if (!profileIds.length) {
    return roles as BandRoleWithProfile[]
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, role')
    .in('id', profileIds)

  if (error) {
    throw new Error(error.message)
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  return roles.map((role) => ({
    ...role,
    profile: (profilesById.get(role.profile_id) as BandRoleWithProfile['profile']) ?? null,
  }))
}

export async function listBandRolesForProfileId(supabase: SupabaseClient<any>, profileId: string) {
  const { data, error } = await supabase
    .from('band_roles')
    .select('id, band_id, profile_id, band_role, active, created_at, updated_at')
    .eq('profile_id', profileId)
    .order('band_role', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as BandRole[]
}

export async function upsertBandRole(
  supabase: SupabaseClient<any>,
  bandId: string,
  profileId: string,
  bandRole: 'admin' | 'member' = 'member',
  active = true
) {
  const { error } = await supabase.from('band_roles').upsert(
    {
      band_id: bandId,
      profile_id: profileId,
      band_role: bandRole,
      active,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'band_id,profile_id' }
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function removeBandRole(supabase: SupabaseClient<any>, bandId: string, profileId: string) {
  const { error } = await supabase.from('band_roles').delete().eq('band_id', bandId).eq('profile_id', profileId)
  if (error) {
    throw new Error(error.message)
  }
}
