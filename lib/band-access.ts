import { type SupabaseClient } from '@supabase/supabase-js'
import { listBandRolesForProfileId } from './band-roles'

export type LiveBandAccessContext = {
  userId: string
  username: string
  displayName: string | null
  bandId: string
  bandName: string
  bandRole: 'admin' | 'member'
}

export async function getLiveBandAccessContext(
  authSupabase: SupabaseClient<any>,
  serviceSupabase: SupabaseClient<any>,
  options?: { requireAdmin?: boolean }
): Promise<LiveBandAccessContext | null> {
  const { requireAdmin = false } = options ?? {}

  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, role, active_band_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || (profile.role !== 'band' && profile.role !== 'admin')) {
    return null
  }

  const roles = await listBandRolesForProfileId(serviceSupabase, user.id)
  const bandId = profile.active_band_id ?? roles.find((role) => role.active && role.band_role === 'admin')?.band_id ?? roles.find((role) => role.active)?.band_id ?? roles[0]?.band_id ?? null
  if (!bandId) {
    return null
  }

  const currentRole = roles.find((role) => role.band_id === bandId && role.band_role === 'admin') ?? roles.find((role) => role.band_id === bandId) ?? null
  if (!currentRole) {
    return null
  }

  if (requireAdmin && currentRole.band_role !== 'admin') {
    return null
  }

  const { data: band } = await serviceSupabase.from('bands').select('id, band_name').eq('id', bandId).maybeSingle()

  return {
    userId: user.id,
    username: profile.username?.trim() || user.email?.trim() || 'band-user',
    displayName:
      profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || null,
    bandId,
    bandName: band?.band_name ?? 'Band',
    bandRole: currentRole.band_role,
  }
}
