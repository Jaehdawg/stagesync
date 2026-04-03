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

function normalizeSongSourceMode(value: string) {
  return value === 'tidal_playlist' ? 'tidal_playlist' : 'uploaded'
}

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  const authSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const formData = await request.formData()
  const action = String(formData.get('action') ?? 'create')
  const name = String(formData.get('name') ?? 'StageSync Live').trim()
  const description = String(formData.get('description') ?? 'Live karaoke show').trim()
  const eventId = String(formData.get('eventId') ?? '').trim()
  const showDurationMinutes = Number(formData.get('showDurationMinutes'))
  const signupBufferMinutes = Number(formData.get('signupBufferMinutes'))
  const songSourceMode = normalizeSongSourceMode(String(formData.get('songSourceMode') ?? ''))

  if (testSession?.role === 'band') {
    const bandId = testSession.activeBandId
    if (!bandId) {
      return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
    }

    if (action === 'create') {
      const { error: createError } = await serviceSupabase.from('events').insert({
        band_id: bandId,
        host_id: null,
        name,
        description,
        is_active: true,
        allow_signups: true,
      })

      if (createError) {
        return NextResponse.json({ message: createError.message }, { status: 500 })
      }

      const { data: event } = await serviceSupabase.from('events').select('id').eq('band_id', bandId).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (event?.id) {
        const { error: settingsError } = await serviceSupabase.from('test_show_settings').upsert(
          {
            band_id: bandId,
            event_id: event.id,
            show_duration_minutes: Number.isFinite(showDurationMinutes) ? showDurationMinutes : 60,
            signup_buffer_minutes: Number.isFinite(signupBufferMinutes) ? signupBufferMinutes : 1,
            song_source_mode: songSourceMode,
            tidal_playlist_url: null,
            allow_tips: true,
          },
          { onConflict: 'band_id' }
        )
        if (settingsError) {
          return NextResponse.json({ message: settingsError.message }, { status: 500 })
        }
      }

      return NextResponse.redirect(new URL('/band', request.url))
    }

    if (action === 'settings') {
      if (!eventId) {
        return NextResponse.json({ message: 'Event ID is required.' }, { status: 400 })
      }

      const { data: currentSettings } = await serviceSupabase
        .from('test_show_settings')
        .select('tidal_playlist_url')
        .eq('band_id', bandId)
        .maybeSingle()

      const { error: settingsError } = await serviceSupabase.from('test_show_settings').upsert(
        {
          band_id: bandId,
          event_id: eventId,
          show_duration_minutes: Number.isFinite(showDurationMinutes) ? showDurationMinutes : 60,
          signup_buffer_minutes: Number.isFinite(signupBufferMinutes) ? signupBufferMinutes : 1,
          song_source_mode: songSourceMode,
          tidal_playlist_url: currentSettings?.tidal_playlist_url ?? null,
          allow_tips: true,
        },
        { onConflict: 'band_id' }
      )

      if (settingsError) {
        return NextResponse.json({ message: settingsError.message }, { status: 500 })
      }

      const { error: eventError } = await serviceSupabase
        .from('events')
        .update({ name, description })
        .eq('id', eventId)
        .eq('band_id', bandId)

      if (eventError) {
        return NextResponse.json({ message: eventError.message }, { status: 500 })
      }

      return NextResponse.redirect(new URL('/band', request.url))
    }

    return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
  }

  const liveAccess = await getLiveBandAccessContext(authSupabase, serviceSupabase, { requireAdmin: true })
  if (!liveAccess) {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  if (action === 'create') {
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
        band_id: liveAccess.bandId,
        event_id: event.id,
        playlist_only: false,
        lyrics_enabled: true,
        allow_tips: true,
        signup_buffer_minutes: Number.isFinite(signupBufferMinutes) ? signupBufferMinutes : 1,
        show_duration_minutes: Number.isFinite(showDurationMinutes) ? showDurationMinutes : 60,
        song_source_mode: songSourceMode,
      })
      if (settingsError) {
        return NextResponse.json({ message: settingsError.message }, { status: 500 })
      }
    }

    return NextResponse.redirect(new URL('/band', request.url))
  }

  if (action === 'settings') {
    if (!eventId) {
      return NextResponse.json({ message: 'Event ID is required.' }, { status: 400 })
    }

    const { error: settingsError } = await serviceSupabase.from('show_settings').upsert(
      {
        band_id: liveAccess.bandId,
        event_id: eventId,
        playlist_only: false,
        lyrics_enabled: true,
        allow_tips: true,
        signup_buffer_minutes: Number.isFinite(signupBufferMinutes) ? signupBufferMinutes : 1,
        show_duration_minutes: Number.isFinite(showDurationMinutes) ? showDurationMinutes : 60,
        song_source_mode: songSourceMode,
      },
      { onConflict: 'event_id' }
    )

    if (settingsError) {
      return NextResponse.json({ message: settingsError.message }, { status: 500 })
    }

    const { error: eventError } = await serviceSupabase
      .from('events')
      .update({ name, description })
      .eq('id', eventId)
      .eq('band_id', liveAccess.bandId)

    if (eventError) {
      return NextResponse.json({ message: eventError.message }, { status: 500 })
    }

    return NextResponse.redirect(new URL('/band', request.url))
  }

  return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
}
