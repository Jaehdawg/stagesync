import { NextResponse, type NextRequest } from 'next/server'
import { fetchTidalPlaylistTracks } from '@/lib/tidal'

export async function GET(request: NextRequest) {
  const playlistUrl = request.nextUrl.searchParams.get('url')?.trim() || ''

  if (!playlistUrl) {
    return NextResponse.json({ tracks: [], message: 'Playlist URL is required.' }, { status: 400 })
  }

  const tracks = await fetchTidalPlaylistTracks(playlistUrl, { limit: 200 })
  return NextResponse.json({ tracks })
}
