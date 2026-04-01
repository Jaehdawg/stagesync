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
      const mode = songSourceMode === 'tidal_playlist' ? songSourceMode : 'uploaded'
      const playlistUrl = tidalPlaylistUrl.trim() || null

      if (mode === 'tidal_playlist' && !playlistUrl) {
        return NextResponse.json({ message: 'Add a Tidal playlist URL before saving playlist mode.' }, { status: 400 })
      }

      await updateTestShowSettings(supabase, {
        eventId,
        showDurationMinutes: Number.isFinite(showDurationMinutes) ? showDurationMinutes : 60,
        signupBufferMinutes: Number.isFinite(signupBufferMinutes) ? signupBufferMinutes : 1,
        songSourceMode: mode,
        tidalPlaylistUrl: playlistUrl,
      })
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
