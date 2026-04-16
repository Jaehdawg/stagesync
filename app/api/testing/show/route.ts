import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTestSession } from '@/lib/test-session'
import { createTestShow, updateTestShowSettings, updateTestShowState } from '@/lib/test-show'

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
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Testing show controls are disabled.' }, { status: 404 })
  }

  const testSession = await getTestSession()
  if (!testSession || (testSession.role !== 'band' && testSession.role !== 'admin')) {
    return NextResponse.json({ message: 'Testing login required.' }, { status: 401 })
  }

  if (!testSession.activeBandId) {
    return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
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
  const requestModeEnabled = String(formData.get('requestModeEnabled') ?? '').trim().toLowerCase() === 'true' || String(formData.get('requestModeEnabled') ?? '').trim().toLowerCase() === 'on'
  const requestSourceMode = String(formData.get('requestSourceMode') ?? 'set_list').trim()
  const playlistUrl = String(formData.get('tidalPlaylistUrl') ?? '').trim()

  try {
    if (action === 'create') {
      const { data: band } = await supabase.from('bands').select('band_name').eq('id', testSession.activeBandId).maybeSingle()
      const createdShow = await createTestShow(supabase, {
        band_id: testSession.activeBandId,
        band_name: band?.band_name ?? null,
        name,
        description,
      })
      if (createdShow?.id) {
        await updateTestShowSettings(supabase, {
          band_id: testSession.activeBandId,
          event_id: createdShow.id,
          showDurationMinutes: Number.isFinite(showDurationMinutes) ? showDurationMinutes : 60,
          signupBufferMinutes: Number.isFinite(signupBufferMinutes) ? signupBufferMinutes : 1,
          songSourceMode: songSourceMode === 'set_list' || songSourceMode === 'tidal_playlist' || songSourceMode === 'tidal_catalog' ? songSourceMode : 'uploaded',
          requestModeEnabled,
          requestSourceMode: requestSourceMode === 'uploaded' || requestSourceMode === 'tidal_catalog' ? requestSourceMode : 'set_list',
          tidalPlaylistUrl: songSourceMode === 'tidal_playlist' ? playlistUrl || null : null,
        })
      }
    } else if (action === 'settings') {
      const mode = songSourceMode === 'set_list' || songSourceMode === 'tidal_playlist' || songSourceMode === 'tidal_catalog' ? songSourceMode : 'uploaded'
      const { data: currentSettings } = await supabase
        .from('test_show_settings')
        .select('tidal_playlist_url')
        .eq('band_id', testSession.activeBandId)
        .maybeSingle()

      const nextPlaylistUrl =
        mode === 'tidal_playlist'
          ? playlistUrl || currentSettings?.tidal_playlist_url || null
          : currentSettings?.tidal_playlist_url || null

      await updateTestShowSettings(supabase, {
        band_id: testSession.activeBandId,
        event_id: eventId,
        showDurationMinutes: Number.isFinite(showDurationMinutes) ? showDurationMinutes : 60,
        signupBufferMinutes: Number.isFinite(signupBufferMinutes) ? signupBufferMinutes : 1,
        songSourceMode: mode,
        requestModeEnabled,
        requestSourceMode: requestSourceMode === 'uploaded' || requestSourceMode === 'tidal_catalog' ? requestSourceMode : 'set_list',
        tidalPlaylistUrl: nextPlaylistUrl,
      })
    } else if (action === 'start' || action === 'pause' || action === 'resume' || action === 'end') {
      await updateTestShowState(supabase, { event_id: eventId, action })
      if (action === 'end') {
        await supabase.from('queue_items').delete().eq('event_id', eventId)
      }
    } else {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update show.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band', request.url))
}
