import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getTestSession } from '@/lib/test-session'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { getShowState } from '@/lib/show-state'
import { slugifySongId } from '@/lib/song-library'

function getSupabase(request: NextRequest) {
  return createServerClient(
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
}

function trimValue(value: FormDataEntryValue | null | undefined) {
  return String(value ?? '').trim()
}

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  const authSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const contentType = request.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  const body = isJson
    ? (await request.json().catch(() => ({}))) as {
        singerName?: string
        title?: string
        artist?: string
        showId?: string
      }
    : Object.fromEntries(await request.formData())

  const singerName = trimValue(body.singerName)
  const title = trimValue(body.title)
  const artist = trimValue(body.artist)
  const requestedShowId = trimValue(body.showId)

  let bandId: string | null = null

  if (testSession?.role === 'band' || testSession?.role === 'admin') {
    bandId = testSession.activeBandId ?? null
  } else {
    const liveAccess = await getLiveBandAccessContext(authSupabase, serviceSupabase, { requireAdmin: true })
    bandId = liveAccess?.bandId ?? null
  }

  if (!bandId) {
    return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
  }

  if (!singerName) {
    return NextResponse.json({ message: 'Singer name is required.' }, { status: 400 })
  }

  if (!title || !artist) {
    return NextResponse.json({ message: 'Song title and artist are required.' }, { status: 400 })
  }

  const currentShowResult = requestedShowId
    ? await serviceSupabase
        .from('events')
        .select('id, band_id, is_active, allow_signups')
        .eq('id', requestedShowId)
        .eq('band_id', bandId)
        .maybeSingle()
    : await serviceSupabase
        .from('events')
        .select('id, band_id, is_active, allow_signups')
        .eq('band_id', bandId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

  const currentShow = currentShowResult.data ?? null
  const showState = getShowState(currentShow)

  if (!currentShow?.id || showState === 'ended') {
    return NextResponse.json({ message: 'The show is not currently accepting queue entries.' }, { status: 409 })
  }

  const songId = slugifySongId(title, artist)
  const { error: songError } = await serviceSupabase.from('songs').upsert(
    {
      id: songId,
      title,
      artist,
      archived_at: null,
      source_type: 'manual',
      source_ref: null,
      band_id: bandId,
    },
    { onConflict: 'band_id,id' }
  )

  if (songError) {
    return NextResponse.json({ message: songError.message }, { status: 500 })
  }

  const { data: existing } = await serviceSupabase
    .from('queue_items')
    .select('position')
    .eq('event_id', currentShow.id)
    .eq('band_id', bandId)
    .in('status', ['pending', 'queued'])
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPosition = typeof existing?.position === 'number' ? existing.position + 1 : 1

  const { error: queueError } = await serviceSupabase.from('queue_items').insert({
    event_id: currentShow.id,
    band_id: bandId,
    performer_id: null,
    singer_name: singerName,
    song_id: songId,
    status: 'queued',
    position: nextPosition,
  })

  if (queueError) {
    return NextResponse.json({ message: queueError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Manual queue entry added.' })
}
