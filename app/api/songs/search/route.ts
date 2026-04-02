import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || ''
  const bandId = request.nextUrl.searchParams.get('bandId')?.trim() || ''

  const supabase = createServiceClient()
  let builder = supabase
    .from('songs')
    .select('id, title, artist, duration_ms')
    .eq('band_id', bandId)
    .is('archived_at', null)
    .order('artist', { ascending: true })
    .order('title', { ascending: true })

  if (query) {
    builder = builder.or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
  }

  const { data, error } = await builder

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ songs: data ?? [] })
}
