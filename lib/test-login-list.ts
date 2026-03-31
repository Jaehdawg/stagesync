import type { SupabaseClient } from '@supabase/supabase-js'

export type TestLoginRow = {
  username: string
  role: 'singer' | 'band' | 'admin'
  password_hash: string
  band_name: string | null
  band_access_level: 'admin' | 'member' | null
}

export async function listTestLogins(supabase: SupabaseClient): Promise<TestLoginRow[]> {
  const { data, error } = await supabase.from('test_logins').select('*').order('created_at', { ascending: false })
  if (error) {
    return []
  }

  return (data ?? []) as TestLoginRow[]
}

export async function getTestLogin(supabase: SupabaseClient, username: string): Promise<TestLoginRow | null> {
  const { data, error } = await supabase.from('test_logins').select('*').eq('username', username).maybeSingle()

  if (error) {
    return null
  }

  return (data ?? null) as TestLoginRow | null
}
