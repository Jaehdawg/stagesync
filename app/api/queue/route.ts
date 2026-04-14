import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '../../../utils/supabase/service'
import { recordAnalyticsEvent } from '../../../lib/analytics-events'
import { getShowState } from '../../../lib/show-state'

type SongSourceType = 'uploaded' | 'google_sheet' | 'tidal_playlist' | 'tidal_catalog' | 'manual'

function normalizeSongId(title: string, artist: string) {
  return `${title}-${artist}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'You must sign in to request a song.' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const userRole = profile?.role ?? user.user_metadata?.role ?? 'singer'
  if (userRole !== 'singer') {
    return NextResponse.json({ message: 'Only singers can add songs from this screen.' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string
    artist?: string
    bandId?: string
    showId?: string
    action?: 'upsert' | 'cancel'
    sourceType?: SongSourceType
    sourceRef?: string | null
  }

  const action = body.action ?? 'upsert'
  const bandId = body.bandId?.trim() || null
  const showId = body.showId?.trim() || null

  if (!bandId || !showId) {
    return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()
  const [showResult, currentRequestResult] = await Promise.all([
    serviceSupabase
      .from('events')
      .select('id, band_id, is_active, allow_signups')
      .eq('id', showId)
      .eq('band_id', bandId)
      .maybeSingle(),
    serviceSupabase
      .from('queue_items')
      .select('id, song_id, status, position')
      .eq('event_id', showId)
      .eq('band_id', bandId)
      .eq('performer_id', user.id)
      .in('status', ['pending', 'queued'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (showResult.error) {
    return NextResponse.json({ message: showResult.error.message }, { status: 500 })
  }

  const currentShow = showResult.data
  const currentSingerRequest = currentRequestResult.data
  const showState = getShowState(currentShow)

  if (action === 'cancel') {
    if (!currentSingerRequest?.id) {
      return NextResponse.json({ message: 'No song to cancel.' }, { status: 400 })
    }

    const { error } = await serviceSupabase.from('queue_items').update({ status: 'cancelled' }).eq('id', currentSingerRequest.id)
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Song request cancelled.' })
  }

  const title = body.title?.trim()
  const artist = body.artist?.trim()
  if (!title || !artist) {
    return NextResponse.json({ message: 'Song title and artist are required.' }, { status: 400 })
  }

  const sourceType: SongSourceType = body.sourceType ?? 'uploaded'
  const sourceRef = body.sourceRef?.trim() || null

  if (showState !== 'active' || !currentShow?.id) {
    if (!currentSingerRequest?.id) {
      return NextResponse.json({ message: 'The show is not currently accepting new songs.' }, { status: 409 })
    }
  }

  const songId = normalizeSongId(title, artist)
  const { error: songError } = await serviceSupabase.from('songs').upsert(
    {
      id: songId,
      title,
      artist,
      archived_at: null,
      source_type: sourceType,
      source_ref: sourceRef,
      band_id: bandId,
    },
    { onConflict: 'band_id,id' }
  )

  if (songError) {
    return NextResponse.json({ message: songError.message }, { status: 500 })
  }

  void recordAnalyticsEvent(serviceSupabase, {
    eventName: 'queue.song.requested',
    source: 'singer.queue.request',
    bandId,
    actorRole: 'singer',
    actorUserId: user.id,
    entityType: 'queue_items',
    entityId: currentSingerRequest?.id ?? null,
    properties: {
      sourceType,
      songId,
      action,
    },
  }).catch(() => {})

  if (currentSingerRequest?.id) {
    const { error: updateError } = await serviceSupabase
      .from('queue_items')
      .update({
        song_id: songId,
        status: 'queued',
        event_id: showId,
        band_id: bandId,
      })
      .eq('id', currentSingerRequest.id)

    if (updateError) {
      return NextResponse.json({ message: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Song request updated.' })
  }

  const { data: existing } = await serviceSupabase
    .from('queue_items')
    .select('position')
    .eq('event_id', showId)
    .eq('band_id', bandId)
    .in('status', ['pending', 'queued'])
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPosition = typeof existing?.position === 'number' ? existing.position + 1 : 1

  const { error: queueError } = await serviceSupabase.from('queue_items').insert({
    event_id: showId,
    band_id: bandId,
    performer_id: user.id,
    song_id: songId,
    status: 'queued',
    position: nextPosition,
  })

  if (queueError) {
    return NextResponse.json({ message: queueError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Song request added to the queue.' })
}
