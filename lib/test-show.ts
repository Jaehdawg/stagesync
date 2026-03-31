import type { SupabaseClient } from '@supabase/supabase-js'

export type TestShowRow = {
  id: string
  name: string
  description: string | null
  is_active: boolean | null
  allow_signups: boolean | null
  access_code: string | null
  created_at: string | null
}

export type TestShowSettingsRow = {
  id: string
  event_id: string
  playlist_only: boolean | null
  lyrics_enabled: boolean | null
  allow_tips: boolean | null
  signup_buffer_minutes: number | null
  show_duration_minutes: number | null
  song_source_mode: 'uploaded' | 'tidal_playlist' | 'tidal_catalog' | null
  tidal_playlist_url: string | null
}

export async function getLatestTestShow(supabase: SupabaseClient): Promise<TestShowRow | null> {
  const { data, error } = await supabase.rpc('test_latest_show')

  if (error) {
    return null
  }

  return (data?.[0] as TestShowRow | undefined) ?? null
}

export async function createTestShow(
  supabase: SupabaseClient,
  input: { name?: string; description?: string }
): Promise<TestShowRow> {
  const { data, error } = await supabase.rpc('test_create_show', {
    p_name: input.name ?? '',
    p_description: input.description ?? '',
  })

  if (error || !data) {
    throw new Error(error?.message || 'Unable to create show')
  }

  return data as TestShowRow
}

export async function updateTestShowState(
  supabase: SupabaseClient,
  input: { eventId?: string | null; action: 'start' | 'pause' | 'resume' | 'end' }
): Promise<TestShowRow> {
  const { data, error } = await supabase.rpc('test_update_show_state', {
    p_event_id: input.eventId ?? null,
    p_action: input.action,
  })

  if (error || !data) {
    throw new Error(error?.message || 'Unable to update show')
  }

  return data as TestShowRow
}

export async function getLatestTestShowSettings(supabase: SupabaseClient, eventId?: string | null) {
  const query = supabase.from('show_settings').select('*')
  const response = eventId ? await query.eq('event_id', eventId).maybeSingle() : await query.order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (response.error) {
    return null
  }

  return (response.data as TestShowSettingsRow | null) ?? null
}

export async function updateTestShowSettings(
  supabase: SupabaseClient,
  input: { eventId?: string | null; showDurationMinutes?: number; signupBufferMinutes?: number; songSourceMode?: 'uploaded' | 'tidal_playlist' | 'tidal_catalog' }
): Promise<TestShowSettingsRow> {
  const { data, error } = await supabase.rpc('test_update_show_settings', {
    p_event_id: input.eventId ?? null,
    p_show_duration_minutes: input.showDurationMinutes ?? 60,
    p_signup_buffer_minutes: input.signupBufferMinutes ?? 1,
    p_song_source_mode: input.songSourceMode ?? 'uploaded',
  })

  if (error || !data) {
    throw new Error(error?.message || 'Unable to update show settings')
  }

  return data as TestShowSettingsRow
}
