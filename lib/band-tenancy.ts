import type { SupabaseClient } from '@supabase/supabase-js'
import type { TestLoginSession } from './test-login'

export type BandRow = {
  id: string
  band_name: string
  created_at?: string | null
}

export type BandMembershipRow = {
  band_id: string
  member_type: 'profile' | 'test_login'
  member_key: string
  band_access_level: 'admin' | 'member'
  active: boolean
}

export type BandAccessContext = {
  bands: BandRow[]
  activeBandId: string | null
  activeBand: BandRow | null
  needsSelection: boolean
}

export type BandProfileRow = {
  id: string
  band_name: string
  website_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  apple_music_url: string | null
  spotify_url: string | null
  facebook_url: string | null
  twitch_url: string | null
  x_url: string | null
  created_at?: string | null
}

function normalizeBandId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

async function listAllBands(supabase: SupabaseClient<any>) {
  const { data, error } = await supabase
    .from('bands')
    .select('id, band_name, created_at')
    .order('band_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as BandRow[]
}

export async function listBandsForTestLogin(supabase: SupabaseClient<any>, session: Pick<TestLoginSession, 'role' | 'username'>) {
  if (session.role === 'admin') {
    return listAllBands(supabase)
  }

  const { data: memberships, error } = await supabase
    .from('band_memberships')
    .select('band_id, member_type, member_key, band_access_level, active')
    .eq('member_type', 'test_login')
    .eq('member_key', session.username)
    .eq('active', true)

  if (error) {
    throw new Error(error.message)
  }

  const bandIds = [...new Set((memberships ?? []).map((membership) => normalizeBandId(membership.band_id)).filter(Boolean))] as string[]
  if (!bandIds.length) {
    return []
  }

  const { data: bands, error: bandsError } = await supabase
    .from('bands')
    .select('id, band_name, created_at')
    .in('id', bandIds)
    .order('band_name', { ascending: true })

  if (bandsError) {
    throw new Error(bandsError.message)
  }

  return (bands ?? []) as BandRow[]
}

export async function resolveBandAccessForTestLogin(supabase: SupabaseClient<any>, session: TestLoginSession) {
  const bands = await listBandsForTestLogin(supabase, session)
  const activeBandId = normalizeBandId(session.activeBandId)
  const activeBand = activeBandId ? bands.find((band) => band.id === activeBandId) ?? null : null

  return {
    bands,
    activeBandId: activeBand?.id ?? null,
    activeBand,
    needsSelection: bands.length > 1 && !activeBand,
  } satisfies BandAccessContext
}

export async function getDefaultBandForTestLogin(supabase: SupabaseClient<any>, session: Pick<TestLoginSession, 'role' | 'username'>) {
  const bands = await listBandsForTestLogin(supabase, session)
  return bands[0] ?? null
}

export async function setActiveBandForTestLogin(supabase: SupabaseClient<any>, session: Pick<TestLoginSession, 'username'>, bandId: string | null) {
  const { error } = await supabase
    .from('test_logins')
    .update({ active_band_id: bandId })
    .eq('username', session.username)

  if (error) {
    throw new Error(error.message)
  }
}

export async function getBandProfileForBandId(supabase: SupabaseClient<any>, bandId: string) {
  const { data, error } = await supabase
    .from('band_profiles')
    .select('id, band_name, website_url, instagram_url, tiktok_url, apple_music_url, spotify_url, facebook_url, twitch_url, x_url, created_at, band_id, logo_url, paypal_url, venmo_url, cashapp_url, custom_message')
    .eq('band_id', bandId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (data) {
    const profile = data as BandProfileRow & { band_id?: string | null; logo_url?: string | null; paypal_url?: string | null; venmo_url?: string | null; cashapp_url?: string | null; custom_message?: string | null }
    return {
      ...profile,
      band_id: bandId,
    }
  }

  const { data: testProfile, error: testError } = await supabase
    .from('test_band_profiles')
    .select('id, band_id, band_name, website_url, facebook_url, instagram_url, tiktok_url, paypal_url, venmo_url, cashapp_url, custom_message, created_at')
    .eq('band_id', bandId)
    .maybeSingle()

  if (testError) {
    throw new Error(testError.message)
  }

  if (!testProfile) {
    return null
  }

  return {
    ...testProfile,
    band_id: bandId,
  }
}
