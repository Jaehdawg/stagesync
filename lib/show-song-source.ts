import type { SupabaseClient } from '@supabase/supabase-js'

export type ShowSongSourceRow = {
  id: string
  event_id: string
  source_mode: 'uploaded' | 'tidal_playlist' | 'tidal_catalog'
  tidal_playlist_url: string | null
}

export async function getLatestShowSongSource(supabase: SupabaseClient, eventId?: string | null) {
  const query = supabase.from('show_song_sources').select('*')
  const response = eventId
    ? await query.eq('event_id', eventId).maybeSingle()
    : await query.order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (response.error) {
    return null
  }

  return (response.data as ShowSongSourceRow | null) ?? null
}

export async function upsertShowSongSource(
  supabase: SupabaseClient,
  input: { eventId: string; sourceMode: 'uploaded' | 'tidal_playlist' | 'tidal_catalog'; tidalPlaylistUrl?: string | null }
) {
  const { data, error } = await supabase
    .from('show_song_sources')
    .upsert(
      {
        event_id: input.eventId,
        source_mode: input.sourceMode,
        tidal_playlist_url: input.tidalPlaylistUrl ?? null,
      },
      { onConflict: 'event_id' }
    )
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Unable to update song source settings')
  }

  return data as ShowSongSourceRow
}

