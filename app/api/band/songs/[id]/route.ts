import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { isBandAdminRequest } from '@/lib/band-auth'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isBandAdminRequest(request))) {
    return NextResponse.json({ message: 'Band access required.' }, { status: 401 })
  }

  const { id } = await context.params
  const formData = await request.formData()
  const action = String(formData.get('action') ?? 'update')

  const serviceSupabase = createServiceClient()

  if (action === 'delete') {
    const { error } = await serviceSupabase.from('songs').update({ archived_at: new Date().toISOString() }).eq('id', id)
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.redirect(new URL('/band/songs', request.url), { status: 303 })
  }

  const title = String(formData.get('title') ?? '').trim()
  const artist = String(formData.get('artist') ?? '').trim()
  const durationValue = String(formData.get('durationMs') ?? '').trim()
  const duration_ms = durationValue ? Number(durationValue) : null

  if (!title || !artist) {
    return NextResponse.json({ message: 'Song title and artist are required.' }, { status: 400 })
  }

  const { error } = await serviceSupabase
    .from('songs')
    .update({
      title,
      artist,
      duration_ms: Number.isFinite(duration_ms ?? NaN) ? duration_ms : null,
      archived_at: null,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band/songs', request.url), { status: 303 })
}
