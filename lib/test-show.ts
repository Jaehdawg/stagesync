import type { SupabaseClient } from '@supabase/supabase-js'

type SupabaseLike = Pick<SupabaseClient, 'from'>

export type TestShowRow = {
  id: string
  band_id?: string | null
  band_name?: string | null
  host_id?: string | null
  name?: string | null
  description?: string | null
  is_active?: boolean | null
  allow_signups?: boolean | null
  ended_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type TestShowSettingsRow = {
  id: string
  band_id?: string | null
  event_id?: string | null
  show_duration_minutes?: number | null
  signup_buffer_minutes?: number | null
  playlist_only?: boolean | null
  lyrics_enabled?: boolean | null
  allow_tips?: boolean | null
  song_source_mode?: 'uploaded' | 'tidal_playlist' | 'tidal_catalog' | 'set_list' | null
  tidal_playlist_url?: string | null
  created_at?: string | null
}

function normalizeBandId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function isMissingTableError(error: unknown, tableName: string) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  return message.includes(`public.${tableName}`) || message.includes(tableName) || (typeof error === 'object' && error !== null && 'code' in error && String((error as { code?: unknown }).code) === 'PGRST205')
}

async function listShowsByBandId(supabase: SupabaseLike, bandId: string) {
  const { data, error } = await supabase
    .from('test_shows')
    .select('*')
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingTableError(error, 'test_shows')) return []
    throw new Error(error.message)
  }
  return (data ?? []) as TestShowRow[]
}

export async function getLatestTestShow(supabase: SupabaseLike, bandId?: string | null) {
  const normalizedBandId = normalizeBandId(bandId)
  const shows = normalizedBandId
    ? await listShowsByBandId(supabase, normalizedBandId)
    : await (async () => {
        const { data, error } = await supabase.from('test_shows').select('*').order('created_at', { ascending: false })
        if (error) {
          if (isMissingTableError(error, 'test_shows')) return []
          throw new Error(error.message)
        }
        return (data ?? []) as TestShowRow[]
      })()

  return shows[0] ?? null
}

export async function getLatestTestShowSettings(supabase: SupabaseLike, bandId?: string | null) {
  const normalizedBandId = normalizeBandId(bandId)
  const query = supabase.from('test_show_settings').select('*').order('created_at', { ascending: false })
  const { data, error } = normalizedBandId ? await query.eq('band_id', normalizedBandId).limit(1) : await query.limit(1)
  if (error) {
    if (isMissingTableError(error, 'test_show_settings')) return null
    throw new Error(error.message)
  }
  return (data ?? [null])[0] as TestShowSettingsRow | null
}

export async function createTestShow(supabase: SupabaseLike, payload: Partial<TestShowRow> & { band_name?: string | null }) {
  const bandId = normalizeBandId(payload.band_id)
  if (!bandId) {
    throw new Error('band_id is required.')
  }

  const { data, error } = await supabase
    .from('test_shows')
    .insert({
      band_id: bandId,
      band_name: payload.band_name ?? null,
      host_id: payload.host_id ?? null,
      name: payload.name ?? null,
      description: payload.description ?? null,
      is_active: payload.is_active ?? false,
      allow_signups: payload.allow_signups ?? true,
    })
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data ?? null) as TestShowRow | null
}

export async function updateTestShowSettings(
  supabase: SupabaseLike,
  payload:
    & Partial<TestShowSettingsRow>
    & {
      band_id?: string | null
      event_id?: string | null
      eventId?: string | null
      showDurationMinutes?: number | null
      signupBufferMinutes?: number | null
      songSourceMode?: 'uploaded' | 'tidal_playlist' | 'tidal_catalog' | 'set_list' | string | null
      tidalPlaylistUrl?: string | null
    }
) {
  const normalizedBandId = normalizeBandId(payload.band_id)
  const normalizedEventId = normalizeBandId(payload.event_id ?? payload.eventId)
  const showDurationMinutes = payload.show_duration_minutes ?? payload.showDurationMinutes ?? null
  const signupBufferMinutes = payload.signup_buffer_minutes ?? payload.signupBufferMinutes ?? null
  const songSourceMode = (payload.song_source_mode ?? payload.songSourceMode ?? 'uploaded') as TestShowSettingsRow['song_source_mode']
  const tidalPlaylistUrl = payload.tidal_playlist_url ?? payload.tidalPlaylistUrl ?? null
  const { data: existing, error: findError } = normalizedBandId
    ? await supabase.from('test_show_settings').select('*').eq('band_id', normalizedBandId).maybeSingle()
    : await supabase.from('test_show_settings').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (findError) throw new Error(findError.message)

  const next = {
    ...(existing ?? {}),
    band_id: normalizedBandId ?? (existing?.band_id ?? null),
    event_id: normalizedEventId ?? (existing?.event_id ?? null),
    show_duration_minutes: showDurationMinutes ?? existing?.show_duration_minutes ?? null,
    signup_buffer_minutes: signupBufferMinutes ?? existing?.signup_buffer_minutes ?? null,
    song_source_mode: songSourceMode ?? existing?.song_source_mode ?? null,
    tidal_playlist_url: tidalPlaylistUrl ?? existing?.tidal_playlist_url ?? null,
  }

  const { data, error } = await supabase
    .from('test_show_settings')
    .upsert(next, { onConflict: 'band_id' })
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data ?? null) as TestShowSettingsRow | null
}

export async function getTestShowSettingsByBandId(supabase: SupabaseLike, bandId?: string | null) {
  return getLatestTestShowSettings(supabase, bandId)
}

export async function updateTestShowState(
  supabase: SupabaseLike,
  payload: { eventId?: string | null; event_id?: string | null; action: string }
) {
  const eventId = normalizeBandId(payload.event_id ?? payload.eventId)
  if (!eventId) {
    throw new Error('eventId is required.')
  }

  const update =
    payload.action === 'start'
      ? { is_active: true, allow_signups: true, ended_at: null }
      : payload.action === 'pause'
        ? { is_active: true, allow_signups: false }
        : payload.action === 'resume'
          ? { is_active: true, allow_signups: true }
          : payload.action === 'end'
            ? { is_active: false, allow_signups: false, ended_at: new Date().toISOString() }
            : null

  if (!update) {
    throw new Error(`Unknown show action: ${payload.action}`)
  }

  const { data, error } = await supabase
    .from('test_shows')
    .update(update)
    .eq('id', eventId)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) {
    throw new Error('No show available to update')
  }

  return data
}
