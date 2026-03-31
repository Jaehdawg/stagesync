export type TidalTrack = {
  id: string
  title: string
  artist: string
  album?: string | null
}

type TokenCache = {
  token: string
  expiresAt: number
} | null

let tokenCache: TokenCache = null

function getTidalBaseUrl() {
  return process.env.TIDAL_API_BASE_URL?.trim() || 'https://openapi.tidal.com/v2'
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readNestedString(value: unknown, key: string): string {
  if (!value || typeof value !== 'object') {
    return ''
  }

  return readString((value as Record<string, unknown>)[key])
}

async function getTidalAccessToken() {
  const clientId = process.env.TIDAL_CLIENT_ID?.trim()
  const clientSecret = process.env.TIDAL_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    return null
  }

  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token
  }

  const response = await fetch('https://auth.tidal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number }
  if (!data.access_token) {
    return null
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }

  return tokenCache.token
}

function normalizeTrack(item: Record<string, unknown>): TidalTrack | null {
  const id = readString(item.id ?? item.trackId ?? item.tidalId)
  const title = readString(item.title ?? item.name)
  const artist = readNestedString(item.artist, 'name') || readString(item.artistName ?? item.artist ?? item.performer ?? item.artist_name)
  const album = readNestedString(item.album, 'title') || readString(item.albumTitle ?? item.album) || null

  if (!id || !title || !artist) {
    return null
  }

  return { id, title, artist, album }
}

export function extractTidalTracks(payload: unknown): TidalTrack[] {
  const candidateArrays: unknown[] = []

  if (Array.isArray(payload)) {
    candidateArrays.push(payload)
  } else if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    candidateArrays.push(record.tracks, record.items, record.data, record.results)

    if (Array.isArray(record.sections)) {
      for (const section of record.sections) {
        if (section && typeof section === 'object') {
          const sectionRecord = section as Record<string, unknown>
          candidateArrays.push(sectionRecord.tracks, sectionRecord.items, sectionRecord.data)
        }
      }
    }
  }

  const tracks: TidalTrack[] = []
  for (const candidate of candidateArrays) {
    if (!Array.isArray(candidate)) continue
    for (const item of candidate) {
      if (item && typeof item === 'object') {
        const track = normalizeTrack(item as Record<string, unknown>)
        if (track) {
          tracks.push(track)
        }
      }
    }
  }

  return tracks
}

async function fetchTidalJson(paths: string[], token: string, query: string, limit: number) {
  for (const path of paths) {
    const url = new URL(path, getTidalBaseUrl())
    url.searchParams.set('query', query)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('countryCode', 'US')

    const response = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/json',
      },
    })

    if (!response.ok) {
      continue
    }

    const payload = await response.json().catch(() => null)
    const tracks = extractTidalTracks(payload)
    if (tracks.length) {
      return tracks
    }
  }

  return []
}

export async function searchTidalTracks(query: string, options: { limit?: number; playlistOnly?: boolean } = {}) {
  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  const limit = Math.min(Math.max(options.limit ?? 10, 1), 25)
  const token = await getTidalAccessToken()

  if (!token) {
    return []
  }

  const searchPaths = options.playlistOnly
    ? ['/v1/search', '/search/tracks']
    : ['/v2/search/tracks', '/v1/search', '/search/tracks']

  return fetchTidalJson(searchPaths, token, trimmed, limit)
}
