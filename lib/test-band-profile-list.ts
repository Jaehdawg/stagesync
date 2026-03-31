import type { SupabaseClient } from '@supabase/supabase-js'
import type { TestBandProfileRow } from './test-band-profile'

export async function listTestBandProfiles(supabase: SupabaseClient): Promise<TestBandProfileRow[]> {
  const { data, error } = await supabase.from('test_band_profiles').select('*').order('created_at', { ascending: false })

  if (error) {
    return []
  }

  return (data ?? []) as TestBandProfileRow[]
}
