import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getShowState } from '@/lib/show-state'
import { createServiceClient } from '@/utils/supabase/service'

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
  if (profile?.role !== 'singer') {
    return NextResponse.json({ message: 'Only singers can add songs from this screen.' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as { title?: string; artist?: string; bandId?: string; showId?: string }
  const title = body.title?.trim()
  const artist = body.artist?.trim()
  const bandId = body.bandId?.trim() || null
  const showId = body.showId?.trim() || null

  if (!title || !artist) {
    return NextResponse.json({ message: 'Song title and artist are required.' }, { status: 400 })
  }

  if (!bandId || !showId) {
    return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()

  const { data: currentShow } = await serviceSupabase
    .from('test_shows')
    .select('id, band_id, is_active, allow_signups')
    .eq('id', showId)
    .eq('band_id', bandId)
    .maybeSingle()

  const showState = getShowState(currentShow)
  if (showState !== 'active' || !currentShow?.id) {
    return NextResponse.json({ message: 'The show is not currently accepting new songs.' }, { status: 409 })
  }

  const songId = normalizeSongId(title, artist)

  const { error: songError } = await serviceSupabase.from('songs').upsert(
    {
      id: songId,
      title,
      artist,
      archived_at: null,
      band_id: bandId,
    },
    { onConflict: 'band_id,id' }
  )

  if (songError) {
    return NextResponse.json({ message: songError.message }, { status: 500 })
  }

  const { error: queueError } = await serviceSupabase.from('queue_items').insert({
    event_id: currentShow.id,
    band_id: bandId,
    performer_id: user.id,
    song_id: songId,
    status: 'pending',
  })

  if (queueError) {
    return NextResponse.json({ message: queueError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Song request added to the queue.' })
}
