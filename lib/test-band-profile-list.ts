import type { SupabaseClient } from '@supabase/supabase-js'
import type { TestBandProfileRow } from './test-band-profile'

export async function listTestBandProfiles(supabase: SupabaseClient): Promise<TestBandProfileRow[]> {
  const { data, error } = await supabase.rpc('test_list_band_profiles')

  if (error) {
    return []
  }

  return (data ?? []) as TestBandProfileRow[]
}
