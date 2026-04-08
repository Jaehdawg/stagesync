import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getTidalAccessToken, searchTidalTracks } from '@/lib/tidal'
import { getBandTidalCredentials } from '@/lib/band-tidal'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || ''
  const bandId = request.nextUrl.searchParams.get('bandId')?.trim() || ''
  const sourceMode = request.nextUrl.searchParams.get('sourceMode')?.trim() || 'uploaded'
  const cursor = request.nextUrl.searchParams.get('cursor')?.trim() || null

  if (!bandId) {
    return NextResponse.json({ songs: [] })
  }

  const supabase = createServiceClient()

  if (sourceMode === 'tidal_catalog') {
    if (!query) {
      return NextResponse.json({ songs: [] })
    }

    const credentials = await getBandTidalCredentials(supabase, bandId)
    const token = await getTidalAccessToken(credentials ?? undefined)
    if (!token) {
      return NextResponse.json({ message: 'Tidal Catalog is unavailable right now. Check the band credentials and try again.' }, { status: 503 })
    }

    const { tracks, nextCursor } = await searchTidalTracks(query, { limit: 30, credentials: credentials ?? undefined, cursor, accessToken: token })
    return NextResponse.json({ songs: tracks, nextCursor })
  }

  let builder = supabase
    .from('songs')
    .select('id, title, artist, duration_ms')
    .eq('band_id', bandId)
    .is('archived_at', null)
    .order('artist', { ascending: true })
    .order('title', { ascending: true })
    .limit(30)

  if (sourceMode === 'tidal_playlist') {
    builder = builder.eq('source_type', 'tidal_playlist')
  }

  if (query) {
    builder = builder.or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
  }

  const { data, error } = await builder

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ songs: data ?? [] })
}
