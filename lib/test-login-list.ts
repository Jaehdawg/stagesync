import type { SupabaseClient } from '@supabase/supabase-js'

export type TestLoginRow = {
  username: string
  role: 'singer' | 'band' | 'admin'
  password_hash: string
  band_name: string | null
}

export async function listTestLogins(supabase: SupabaseClient): Promise<TestLoginRow[]> {
  const { data, error } = await supabase.rpc('test_list_logins')
  if (error) {
    return []
  }

  return (data ?? []) as TestLoginRow[]
}
