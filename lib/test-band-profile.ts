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
  const { data, error } = await supabase.rpc('test_latest_band_profile')

  if (error) {
    return null
  }

  return (data?.[0] as TestBandProfileRow | undefined) ?? null
}

export async function updateTestBandProfile(
  supabase: SupabaseClient,
  input: Partial<Omit<TestBandProfileRow, 'id'>>
): Promise<TestBandProfileRow> {
  const { data, error } = await supabase.rpc('test_update_band_profile', {
    p_band_name: input.band_name ?? '',
    p_cashapp_url: input.cashapp_url ?? '',
    p_custom_message: input.custom_message ?? '',
    p_facebook_url: input.facebook_url ?? '',
    p_instagram_url: input.instagram_url ?? '',
    p_tiktok_url: input.tiktok_url ?? '',
    p_paypal_url: input.paypal_url ?? '',
    p_venmo_url: input.venmo_url ?? '',
    p_website_url: input.website_url ?? '',
  })

  if (error || !data) {
    throw new Error(error?.message || 'Unable to update band profile')
  }

  return data as TestBandProfileRow
}
