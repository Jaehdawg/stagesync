import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || ''

  if (!query) {
    return NextResponse.json({ tracks: [] })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('songs')
    .select('id, title, artist')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .order('title', { ascending: true })
    .limit(20)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({
    tracks: (data ?? []).map((song) => ({ id: song.id, title: song.title, artist: song.artist })),
  })
}
