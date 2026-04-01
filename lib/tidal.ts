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

function readResourceValue(resource: Record<string, unknown> | null | undefined, key: string): string {
  if (!resource) return ''
  return readString(resource[key])
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

function normalizeTrack(item: Record<string, unknown>, includedByKey?: Map<string, Record<string, unknown>>): TidalTrack | null {
  const source = item.track && typeof item.track === 'object' ? { ...item, ...(item.track as Record<string, unknown>) } : item

  const id = readString(source.id ?? source.trackId ?? source.tidalId)
  let title = readString(source.title ?? source.name)
  let artist = readNestedString(source.artist, 'name') || readString(source.artistName ?? source.artist ?? source.performer ?? source.artist_name)
  let album = readNestedString(source.album, 'title') || readString(source.albumTitle ?? source.album) || null

  if ((!title || !artist || !album) && includedByKey && id) {
    const trackResource = includedByKey.get(`tracks:${id}`)
    if (trackResource) {
      const attrs = (trackResource.attributes as Record<string, unknown> | undefined) ?? null
      const relationships = (trackResource.relationships as Record<string, unknown> | undefined) ?? null
      const trackTitle = readResourceValue(attrs, 'title')
      const trackAlbum = readResourceValue(attrs, 'albumTitle') || readResourceValue(attrs, 'album')
      const artistId = (() => {
        const artists = relationships?.artists as { data?: Array<{ id?: unknown }> } | undefined
        return Array.isArray(artists?.data) ? readString(artists?.data[0]?.id) : ''
      })()

      if (!title) {
        title = trackTitle
      }
      if (!album) {
        album = trackAlbum || null
      }
      if (!artist && artistId) {
        const artistResource = includedByKey.get(`artists:${artistId}`)
        const artistAttrs = (artistResource?.attributes as Record<string, unknown> | undefined) ?? null
        artist = readResourceValue(artistAttrs, 'name')
      }
    }
  }

  if (!id || !title || !artist) {
    return null
  }

  return { id, title, artist, album }
}

export function extractTidalTracks(payload: unknown): TidalTrack[] {
  const candidateArrays: unknown[] = []
  const includedByKey = new Map<string, Record<string, unknown>>()

  if (Array.isArray(payload)) {
    candidateArrays.push(payload)
  } else if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    candidateArrays.push(record.tracks, record.items, record.data, record.results)

    if (Array.isArray(record.included)) {
      for (const included of record.included) {
        if (included && typeof included === 'object') {
          const resource = included as Record<string, unknown>
          const type = readString(resource.type)
          const id = readString(resource.id)
          if (type && id) {
            includedByKey.set(`${type}:${id}`, resource)
          }
          candidateArrays.push(resource)
        }
      }
    }

    if (Array.isArray(record.sections)) {
      for (const section of record.sections) {
        if (section && typeof section === 'object') {
          const sectionRecord = section as Record<string, unknown>
          candidateArrays.push(sectionRecord.tracks, sectionRecord.items, sectionRecord.data)

          if (Array.isArray(sectionRecord.included)) {
            for (const included of sectionRecord.included) {
              if (included && typeof included === 'object') {
                const resource = included as Record<string, unknown>
                const type = readString(resource.type)
                const id = readString(resource.id)
                if (type && id) {
                  includedByKey.set(`${type}:${id}`, resource)
                }
                candidateArrays.push(resource)
              }
            }
          }
        }
      }
    }
  }

  const tracks: TidalTrack[] = []
  for (const candidate of candidateArrays) {
    if (!Array.isArray(candidate)) continue
    for (const item of candidate) {
      if (item && typeof item === 'object') {
        const track = normalizeTrack(item as Record<string, unknown>, includedByKey)
        if (track) {
          tracks.push(track)
        }
      }
    }
  }

  return tracks
}

async function fetchTidalJson(paths: string[], token: string, options: { query?: string; limit: number }) {
  const { query, limit } = options
  for (const path of paths) {
    const url = new URL(path, getTidalBaseUrl())
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('countryCode', 'US')

    if (query) {
      url.searchParams.set('query', query)
    }

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

  const searchPaths = [
    `/searchSuggestions/${encodeURIComponent(trimmed)}/relationships/directHits`,
    `/searchSuggestions/${encodeURIComponent(trimmed)}`,
  ]

  return fetchTidalJson(searchPaths, token, { limit })
}

function extractPlaylistId(url: string) {
  const trimmed = url.trim()
  if (!trimmed) {
    return null
  }

  try {
    const parsed = new URL(trimmed)
    const segments = parsed.pathname.split('/').filter(Boolean)
    const playlistIndex = segments.findIndex((segment) => segment === 'playlist')
    const candidate = playlistIndex >= 0 ? segments[playlistIndex + 1] : segments.at(-1)
    return candidate?.trim() || null
  } catch {
    const match = trimmed.match(/playlist\/([A-Za-z0-9_-]+)/i)
    return match?.[1] ?? null
  }
}

export async function fetchTidalPlaylistTracks(playlistUrl: string, options: { limit?: number } = {}) {
  const playlistId = extractPlaylistId(playlistUrl)
  if (!playlistId) {
    return []
  }

  const token = await getTidalAccessToken()
  if (!token) {
    return []
  }

  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500)
  const playlistPaths = [
    `/playlists/${playlistId}/relationships/items`,
    `/playlists/${playlistId}`,
  ]

  return fetchTidalJson(playlistPaths, token, { limit })
}
