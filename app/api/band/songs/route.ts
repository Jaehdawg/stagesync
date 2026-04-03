import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '../../../../utils/supabase/service'
import { getTestSession } from '../../../../lib/test-session'
import { slugifySongId } from '../../../../lib/song-library'
import { getLiveBandAccessContext } from '../../../../lib/band-access'

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
  const title = String(formData.get('title') ?? '').trim()
  const artist = String(formData.get('artist') ?? '').trim()
  const durationValue = String(formData.get('durationMs') ?? '').trim()
  const duration_ms = durationValue ? Number(durationValue) : null

  const bandId =
    testSession?.role === 'band' || testSession?.role === 'admin'
      ? testSession.activeBandId ?? null
      : (await getLiveBandAccessContext(authSupabase, serviceSupabase, { requireAdmin: true }))?.bandId ?? null

  if (!bandId) {
    return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
  }

  if (action === 'delete-all') {
    const { error } = await serviceSupabase
      .from('songs')
      .update({ archived_at: new Date().toISOString() })
      .eq('band_id', bandId)
      .is('archived_at', null)

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.redirect(new URL('/band/songs?deleted=all', request.url), { status: 303 })
  }

  if (!title || !artist) {
    return NextResponse.json({ message: 'Song title and artist are required.' }, { status: 400 })
  }

  const { error } = await serviceSupabase.from('songs').upsert(
    {
      id: slugifySongId(title, artist),
      title,
      artist,
      duration_ms: Number.isFinite(duration_ms ?? NaN) ? duration_ms : null,
      archived_at: null,
      source_type: 'manual',
      source_ref: null,
      band_id: bandId,
    },
    { onConflict: 'band_id,id' }
  )

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band/songs', request.url), { status: 303 })
}
