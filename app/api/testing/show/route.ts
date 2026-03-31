import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTestSession } from '@/lib/test-session'
import { createTestShow, updateTestShowState } from '@/lib/test-show'
import { createServiceClient } from '@/utils/supabase/service'

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
  if (!testSession || (testSession.role !== 'band' && testSession.role !== 'admin')) {
    return NextResponse.json({ message: 'Testing login required.' }, { status: 401 })
  }

  const supabase = getSupabase(request)
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')
  const eventId = String(formData.get('eventId') ?? '') || null
  const name = String(formData.get('name') ?? '')
  const description = String(formData.get('description') ?? '')
  const showDurationMinutes = Number(formData.get('showDurationMinutes'))
  const signupBufferMinutes = Number(formData.get('signupBufferMinutes'))
  const songSourceMode = String(formData.get('songSourceMode') ?? '')
  const tidalPlaylistUrl = String(formData.get('tidalPlaylistUrl') ?? '')

  try {
    if (action === 'create') {
      await createTestShow(supabase, { name, description })
    } else if (action === 'settings') {
      const serviceSupabase = createServiceClient()
      const latestShowResponse = await supabase
        .from('events')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const targetEventId = eventId || latestShowResponse.data?.id || null

      if (!targetEventId) {
        return NextResponse.json({ message: 'No show available to update.' }, { status: 400 })
      }

      const mode = songSourceMode === 'tidal_playlist' || songSourceMode === 'tidal_catalog' ? songSourceMode : 'uploaded'
      const playlistUrl = tidalPlaylistUrl.trim() || null

      if (mode === 'tidal_playlist' && !playlistUrl) {
        return NextResponse.json({ message: 'Add a Tidal playlist URL before saving playlist mode.' }, { status: 400 })
      }

      const { error } = await serviceSupabase
        .from('show_settings')
        .upsert(
          {
            event_id: targetEventId,
            signup_buffer_minutes: Number.isFinite(signupBufferMinutes) ? signupBufferMinutes : 1,
            show_duration_minutes: Number.isFinite(showDurationMinutes) ? showDurationMinutes : 60,
            playlist_only: mode === 'tidal_playlist',
          },
          { onConflict: 'event_id' }
        )

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 })
      }

      const { error: eventError } = await serviceSupabase
        .from('events')
        .update({
          description:
            mode === 'tidal_playlist'
              ? playlistUrl
              : mode === 'tidal_catalog'
                ? '__TIDAL_CATALOG__'
                : null,
        })
        .eq('id', targetEventId)

      if (eventError) {
        return NextResponse.json({ message: eventError.message }, { status: 500 })
      }
    } else if (action === 'start' || action === 'pause' || action === 'resume' || action === 'end') {
      await updateTestShowState(supabase, { eventId, action })
    } else {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update show.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band', request.url))
}
