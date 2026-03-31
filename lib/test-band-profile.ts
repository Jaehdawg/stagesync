import type { SupabaseClient } from '@supabase/supabase-js'

export type TestBandProfileRow = {
  id: string
  band_name: string
  website_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  paypal_url: string | null
  venmo_url: string | null
  cashapp_url: string | null
  custom_message: string | null
}

export async function getLatestTestBandProfile(supabase: SupabaseClient): Promise<TestBandProfileRow | null> {
  const { data, error } = await supabase
    .from('test_band_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return null
  }

  return (data as TestBandProfileRow | null) ?? null
}

export async function listTestBandProfiles(supabase: SupabaseClient): Promise<TestBandProfileRow[]> {
  const { data, error } = await supabase.from('test_band_profiles').select('*').order('created_at', { ascending: false })

  if (error) {
    return []
  }

  return (data ?? []) as TestBandProfileRow[]
}

export async function createTestBandProfile(
  supabase: SupabaseClient,
  input: Partial<Omit<TestBandProfileRow, 'id'>>
): Promise<TestBandProfileRow> {
  const { data, error } = await supabase
    .from('test_band_profiles')
    .insert({
      band_name: input.band_name ?? 'StageSync',
      website_url: input.website_url ?? null,
      facebook_url: input.facebook_url ?? null,
      instagram_url: input.instagram_url ?? null,
      tiktok_url: input.tiktok_url ?? null,
      paypal_url: input.paypal_url ?? null,
      venmo_url: input.venmo_url ?? null,
      cashapp_url: input.cashapp_url ?? null,
      custom_message: input.custom_message ?? null,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Unable to create band profile')
  }

  return data as TestBandProfileRow
}

export async function updateTestBandProfileById(
  supabase: SupabaseClient,
  profileId: string,
  input: Partial<Omit<TestBandProfileRow, 'id'>>
): Promise<TestBandProfileRow> {
  const { data, error } = await supabase
    .from('test_band_profiles')
    .update({
      band_name: input.band_name ?? '',
      website_url: input.website_url ?? null,
      facebook_url: input.facebook_url ?? null,
      instagram_url: input.instagram_url ?? null,
      tiktok_url: input.tiktok_url ?? null,
      paypal_url: input.paypal_url ?? null,
      venmo_url: input.venmo_url ?? null,
      cashapp_url: input.cashapp_url ?? null,
      custom_message: input.custom_message ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Unable to update band profile')
  }

  return data as TestBandProfileRow
}

export async function deleteTestBandProfileById(supabase: SupabaseClient, profileId: string): Promise<void> {
  const { error } = await supabase.from('test_band_profiles').delete().eq('id', profileId)
  if (error) {
    throw new Error(error.message)
  }
}

export async function upsertTestBandProfile(
  supabase: SupabaseClient,
  input: Partial<Omit<TestBandProfileRow, 'id'>>
): Promise<TestBandProfileRow> {
  const latest = await getLatestTestBandProfile(supabase)

  if (!latest) {
    const { data, error } = await supabase
      .from('test_band_profiles')
      .insert({
        band_name: input.band_name ?? 'StageSync',
        website_url: input.website_url ?? null,
        facebook_url: input.facebook_url ?? null,
        instagram_url: input.instagram_url ?? null,
        tiktok_url: input.tiktok_url ?? null,
        paypal_url: input.paypal_url ?? null,
        venmo_url: input.venmo_url ?? null,
        cashapp_url: input.cashapp_url ?? null,
        custom_message: input.custom_message ?? null,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Unable to update band profile')
    }

    return data as TestBandProfileRow
  }

  const { data, error } = await supabase
    .from('test_band_profiles')
    .update({
      band_name: input.band_name ?? latest.band_name,
      website_url: input.website_url ?? null,
      facebook_url: input.facebook_url ?? null,
      instagram_url: input.instagram_url ?? null,
      tiktok_url: input.tiktok_url ?? null,
      paypal_url: input.paypal_url ?? null,
      venmo_url: input.venmo_url ?? null,
      cashapp_url: input.cashapp_url ?? null,
      custom_message: input.custom_message ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', latest.id)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Unable to update band profile')
  }

  return data as TestBandProfileRow
}

export async function deleteLatestTestBandProfile(supabase: SupabaseClient): Promise<void> {
  const latest = await getLatestTestBandProfile(supabase)
  if (!latest) {
    return
  }

  const { error } = await supabase.from('test_band_profiles').delete().eq('id', latest.id)
  if (error) {
    throw new Error(error.message)
  }
}
