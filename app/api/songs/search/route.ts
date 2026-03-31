import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || ''

  const supabase = createServiceClient()
  const baseQuery = supabase
    .from('songs')
    .select('id, title, artist')
    .order('artist', { ascending: true })
    .order('title', { ascending: true })

  const { data, error } = query
    ? await baseQuery.or(`title.ilike.%${query}%,artist.ilike.%${query}%`).limit(20)
    : await baseQuery.limit(200)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({
    tracks: (data ?? []).map((song) => ({ id: song.id, title: song.title, artist: song.artist })),
  })
}
