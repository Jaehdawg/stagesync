import { NextResponse, type NextRequest } from 'next/server'
import { searchTidalTracks } from '@/lib/tidal'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || ''
  const playlistOnly = request.nextUrl.searchParams.get('playlistOnly') === 'true'

  if (!query) {
    return NextResponse.json({ tracks: [] })
  }

  const tracks = await searchTidalTracks(query, { limit: 10, playlistOnly })
  return NextResponse.json({ tracks })
}
