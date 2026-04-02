import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getTestSession } from '@/lib/test-session'
import { getLiveBandAccessContext } from '@/lib/band-access'

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

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  const authSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const formData = await request.formData()
  const action = String(formData.get('action') ?? 'create')
  const name = String(formData.get('name') ?? 'StageSync Live').trim()
  const description = String(formData.get('description') ?? 'Live karaoke show').trim()

  if (testSession?.role === 'band') {
    const bandId = testSession.activeBandId
    if (!bandId) {
      return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
    }

    if (action !== 'create') {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }

    const { data: band } = await serviceSupabase.from('bands').select('band_name').eq('id', bandId).maybeSingle()
    const { error } = await serviceSupabase.from('events').insert({
      band_id: bandId,
      host_id: null,
      name,
      description,
      is_active: true,
      allow_signups: true,
    })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.redirect(new URL('/band', request.url))
  }

  const liveAccess = await getLiveBandAccessContext(authSupabase, serviceSupabase, { requireAdmin: true })
  if (!liveAccess) {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  if (action !== 'create') {
    return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
  }

  const { data: event, error } = await serviceSupabase
    .from('events')
    .insert({
      band_id: liveAccess.bandId,
      host_id: liveAccess.userId,
      name,
      description,
      is_active: true,
      allow_signups: true,
    })
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  if (event?.id) {
    const { error: settingsError } = await serviceSupabase.from('show_settings').insert({
      event_id: event.id,
      playlist_only: false,
      lyrics_enabled: true,
      allow_tips: true,
      signup_buffer_minutes: 1,
      show_duration_minutes: 60,
    })
    if (settingsError) {
      return NextResponse.json({ message: settingsError.message }, { status: 500 })
    }
  }

  return NextResponse.redirect(new URL('/band', request.url))
}
