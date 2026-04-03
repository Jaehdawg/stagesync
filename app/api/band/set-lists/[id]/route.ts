import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '../../../../../utils/supabase/service'
import { getTestSession } from '../../../../../lib/test-session'
import { getTestLogin } from '../../../../../lib/test-login-list'
import { getLiveBandAccessContext } from '../../../../../lib/band-access'
import { activateBandSetList, copyBandSetList, deactivateBandSetList, deleteBandSetList, moveBandSetListSong, removeBandSetListSong, replaceBandSetListSongs, updateBandSetList } from '../../../../../lib/set-lists'

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

async function resolveBandAdmin(request: NextRequest) {
  const testSession = await getTestSession()
  const authSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()

  if (testSession?.role === 'band') {
    const current = await getTestLogin(authSupabase, testSession.username)
    if (!current || current.role !== 'band' || current.band_access_level !== 'admin') {
      return null
    }

    const bandId = testSession.activeBandId ?? current.active_band_id ?? null
    return bandId ? { bandId, mode: 'test' as const } : null
  }

  const liveAccess = await getLiveBandAccessContext(authSupabase, serviceSupabase, { requireAdmin: true })
  return liveAccess ? { bandId: liveAccess.bandId, mode: 'live' as const } : null
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await resolveBandAdmin(request)
  if (!access) {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  const { id } = await context.params
  const formData = await request.formData()
  const action = String(formData.get('action') ?? 'update')
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const notes = String(formData.get('notes') ?? '').trim() || null
  const songId = String(formData.get('songId') ?? '').trim()
  const songIds = String(formData.get('songIds') ?? '')
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean)

  const uniqueSongIds = Array.from(new Set(songIds))

  try {
    if (action === 'delete') {
      await deleteBandSetList(access.bandId, id)
    } else if (action === 'copy') {
      await copyBandSetList(access.bandId, id, name || null)
    } else if (action === 'activate') {
      await activateBandSetList(access.bandId, id)
    } else if (action === 'deactivate') {
      await deactivateBandSetList(access.bandId, id)
    } else if (action === 'remove-song') {
      await removeBandSetListSong(access.bandId, id, songId)
    } else if (action === 'move-up' || action === 'move-down') {
      await moveBandSetListSong(access.bandId, id, songId, action === 'move-up' ? 'up' : 'down')
    } else if (action === 'reorder') {
      const orderedSongIds = String(formData.get('songIds') ?? '')
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean)
      await replaceBandSetListSongs(access.bandId, id, orderedSongIds)
    } else {
      if (!name) {
        return NextResponse.json({ message: 'Set list name is required.' }, { status: 400 })
      }
      await updateBandSetList(access.bandId, id, { name, description, notes, songIds: uniqueSongIds })
    }
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update set list.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band/songs/set-lists', request.url), { status: 303 })
}
