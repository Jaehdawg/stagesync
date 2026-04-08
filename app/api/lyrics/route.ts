import { NextResponse, type NextRequest } from 'next/server'

const cache = new Map<string, { lyrics: string; cachedAt: number }>()
const CACHE_TTL_MS = 1000 * 60 * 30
const LYRICS_FETCH_TIMEOUT_MS = 8_000

function keyFor(artist: string, title: string) {
  return `${artist.toLowerCase().trim()}::${title.toLowerCase().trim()}`
}

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get('artist')?.trim() || ''
  const title = request.nextUrl.searchParams.get('title')?.trim() || ''

  if (!artist || !title) {
    return NextResponse.json({ message: 'Artist and title are required.' }, { status: 400 })
  }

  const cacheKey = keyFor(artist, title)
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ lyrics: cached.lyrics, cached: true })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), LYRICS_FETCH_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, {
      signal: controller.signal,
    })
  } catch {
    return NextResponse.json({ lyrics: '', cached: false })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    return NextResponse.json({ lyrics: '', cached: false })
  }

  const payload = (await response.json().catch(() => ({}))) as { lyrics?: string }
  const lyrics = payload.lyrics?.trim() || ''
  cache.set(cacheKey, { lyrics, cachedAt: Date.now() })

  return NextResponse.json({ lyrics, cached: false })
}
