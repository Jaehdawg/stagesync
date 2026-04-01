import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { isBandAdminRequest } from '@/lib/band-auth'
import { getTestSession } from '@/lib/test-session'
import { slugifySongId } from '@/lib/song-library'

export async function POST(request: NextRequest) {
  if (!(await isBandAdminRequest(request))) {
    return NextResponse.json({ message: 'Band access required.' }, { status: 401 })
  }

  const formData = await request.formData()
  const title = String(formData.get('title') ?? '').trim()
  const artist = String(formData.get('artist') ?? '').trim()
  const durationValue = String(formData.get('durationMs') ?? '').trim()
  const duration_ms = durationValue ? Number(durationValue) : null

  if (!title || !artist) {
    return NextResponse.json({ message: 'Song title and artist are required.' }, { status: 400 })
  }

  const testSession = await getTestSession()
  const bandId = testSession?.activeBandId ?? null
  if (!bandId) {
    return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()
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
