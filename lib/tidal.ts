export type TidalTrack = {
  id: string
  title: string
  artist: string
  album?: string | null
  duration?: number | null
}

type TidalJson = Record<string, unknown>

function getTidalBaseUrl() {
  const base = process.env.TIDAL_API_BASE_URL?.trim() || 'https://openapi.tidal.com/v2/'
  return base.endsWith('/') ? base : `${base}/`
}

async function getTidalAccessToken() {
  const clientId = process.env.TIDAL_CLIENT_ID?.trim()
  const clientSecret = process.env.TIDAL_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    return null
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

  const payload = (await response.json().catch(() => ({}))) as { access_token?: string }
  return payload.access_token ?? null
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'bigint') return String(value)
  return ''
}

function readNestedString(value: unknown, key: string): string {
  if (!value || typeof value !== 'object') return ''
  return readString((value as Record<string, unknown>)[key])
}

function getIdKey(resource: TidalJson) {
  const type = readString(resource.type)
  const id = readText(resource.id)
  return type && id ? `${type}:${id}` : null
}

function resolveResourceReference(resource: unknown, included: Map<string, TidalJson>): TidalJson | null {
  if (!resource || typeof resource !== 'object') {
    return null
  }

  const record = resource as TidalJson
  const key = getIdKey(record)
  return key ? included.get(key) ?? record : record
}

function resolveTrackResource(resource: unknown, included: Map<string, TidalJson>): TidalJson | null {
  const resolved = resolveResourceReference(resource, included)
  if (!resolved) {
    return null
  }

  if (resolved.item && typeof resolved.item === 'object') {
    const nestedItem = resolveTrackResource(resolved.item, included)
    if (nestedItem) {
      return nestedItem
    }
  }

  const type = readString(resolved.type).toLowerCase()
  if (type === 'tracks' || type === 'track') {
    return resolved
  }

  const relationships = (resolved.relationships as TidalJson | undefined) ?? {}
  for (const relationName of ['track', 'item', 'song']) {
    const relation = relationships[relationName] as TidalJson | undefined
    const data = relation?.data
    const firstRelated = Array.isArray(data) ? data[0] : data
    const relatedResource = resolveResourceReference(firstRelated, included)
    const nestedTrack = relatedResource ? resolveTrackResource(relatedResource, included) : null
    if (nestedTrack) {
      return nestedTrack
    }
  }

  return resolved
}

function collectIncludedResources(payload: unknown) {
  const map = new Map<string, TidalJson>()

  const add = (resource: unknown) => {
    if (!resource || typeof resource !== 'object') return
    const record = resource as TidalJson
    const key = getIdKey(record)
    if (key) {
      map.set(key, record)
    }
  }

  if (payload && typeof payload === 'object') {
    const record = payload as TidalJson

    if (Array.isArray(record.included)) {
      for (const resource of record.included) add(resource)
    }

    if (Array.isArray(record.data)) {
      for (const resource of record.data) add(resource)
    }

    if (record.data && typeof record.data === 'object') {
      add(record.data)

      const relationships = (record.data as TidalJson).relationships as TidalJson | undefined
      const directHits = relationships?.directHits as TidalJson | undefined
      if (Array.isArray(directHits?.data)) {
        for (const resource of directHits.data) add(resource)
      }
    }

    if (Array.isArray(record.results)) {
      for (const resource of record.results) add(resource)
    }
  }

  return map
}

function normalizeArtistFromResource(resource: TidalJson): string {
  const attrs = (resource.attributes as TidalJson | undefined) ?? {}
  const directName = readString(attrs.name) || readString(resource.name)
  if (directName) return directName

  const title = readString(attrs.title)
  if (title) return title

  return ''
}

async function fetchArtistName(trackId: string, token: string) {
  const payload = await fetchTidalJson([
    `/tracks/${trackId}/relationships/artists`,
  ], token, { limit: 10 })

  if (!payload) {
    return ''
  }

  const included = collectIncludedResources(payload)
  const names = extractArtistNames(payload, included)
  return names.join(', ')
}

function resolveArtistsFromRelationship(resource: TidalJson, included: Map<string, TidalJson>) {
  const relationshipArtists = (resource.relationships as TidalJson | undefined)?.artists as TidalJson | undefined
  const refs = Array.isArray(relationshipArtists?.data) ? relationshipArtists.data : []
  const names: string[] = []

  for (const ref of refs) {
    if (!ref || typeof ref !== 'object') continue
    const refRecord = ref as TidalJson
    const key = getIdKey(refRecord)
    if (!key) continue
    const artistResource = included.get(key)
    const name = artistResource ? normalizeArtistFromResource(artistResource) : ''
    if (name) names.push(name)
  }

  return names
}

function normalizeTrack(resource: TidalJson, included: Map<string, TidalJson>): TidalTrack | null {
  const source = resource.item && typeof resource.item === 'object'
    ? { ...(resource.item as TidalJson), ...resource }
    : resource.track && typeof resource.track === 'object'
      ? { ...(resource.track as TidalJson), ...resource }
      : resource

  const id = readText(source.id ?? source.trackId ?? source.tidalId ?? source.itemId)
  const attrs = (source.attributes as TidalJson | undefined) ?? {}
  const title = readString(attrs.title ?? source.title ?? source.name)
  const durationValue = source.duration ?? attrs.duration
  const duration = typeof durationValue === 'number' && Number.isFinite(durationValue) ? durationValue : null
  let artist =
    readNestedString(source.artist, 'name') ||
    readString(source.artistName ?? source.artist ?? source.performer ?? source.artist_name)
  const album =
    readNestedString(source.album, 'title') ||
    readString(attrs.albumTitle ?? attrs.album ?? source.albumTitle ?? source.album) ||
    null

  if (!id || !title) return null

  if (!artist) {
    const trackKey = `tracks:${id}`
    const includedTrack = included.get(trackKey)
    if (includedTrack) {
      const includedAttrs = (includedTrack.attributes as TidalJson | undefined) ?? {}
      const includedTitle = readString(includedAttrs.title)
      const includedAlbum = readString(includedAttrs.albumTitle) || readString(includedAttrs.album) || null
      if (includedTitle && !title) {
        // unreachable in practice, but keep the branch for completeness
      }
      if (!artist) {
        const names = resolveArtistsFromRelationship(includedTrack, included)
        if (names.length) artist = names.join(', ')
      }
      if (!artist) {
        artist = readString(includedAttrs.artist) || readString(includedAttrs.artistName)
      }
      if (!artist && includedAlbum) {
        artist = readString(includedAttrs.artistName) || readString(includedAttrs.artist)
      }
    }
  }

  if (!artist) {
    const names = resolveArtistsFromRelationship(source, included)
    if (names.length) artist = names.join(', ')
  }

  if (!artist) {
    artist = 'Unknown artist'
  }

  return {
    id,
    title,
    artist,
    album,
    ...(duration != null ? { duration } : {}),
  }
}

export function extractTidalTracks(payload: unknown): TidalTrack[] {
  const included = collectIncludedResources(payload)
  const candidates: unknown[] = []

  if (Array.isArray(payload)) {
    candidates.push(payload)
  } else if (payload && typeof payload === 'object') {
    const record = payload as TidalJson
    candidates.push(record.tracks, record.items, record.data, record.results)

    if (record.data && typeof record.data === 'object') {
      const relationships = (record.data as TidalJson).relationships as TidalJson | undefined
      const directHits = relationships?.directHits as TidalJson | undefined
      candidates.push(directHits?.data)
    }

    if (Array.isArray(record.sections)) {
      for (const section of record.sections) {
        if (section && typeof section === 'object') {
          const sectionRecord = section as TidalJson
          candidates.push(sectionRecord.tracks, sectionRecord.items, sectionRecord.data)
        }
      }
    }
  }

  const tracks: TidalTrack[] = []

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    for (const item of candidate) {
      if (!item || typeof item !== 'object') continue
      const resolvedItem = resolveTrackResource(item, included) ?? item
      const track = normalizeTrack(resolvedItem as TidalJson, included)
      if (track) tracks.push(track)
    }
  }

  const unique = new Map<string, TidalTrack>()
  for (const track of tracks) {
    unique.set(track.id, track)
  }

  return [...unique.values()]
}

async function fetchTidalJson(
  paths: string[],
  token: string,
  options: { query?: string; limit: number; params?: Record<string, string>; headers?: Record<string, string> }
) {
  const { query, limit, params, headers: extraHeaders } = options

  for (const path of paths) {
    const url = new URL(path, getTidalBaseUrl())
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('countryCode', 'US')

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value)
      }
    }

    if (query) {
      url.searchParams.set('query', query)
    }

    if (path.startsWith('/searchSuggestions/')) {
      url.searchParams.set('include', 'directHits')
    }

    if (path.startsWith('/playlists/')) {
      url.searchParams.set('include', 'items')
    }

    const headers: Record<string, string> = {
      accept: 'application/vnd.api+json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders ?? {}),
    }

    const response = await fetch(url, {
      headers,
    })

    if (response.ok) {
      return response.json().catch(() => null)
    }
  }

  return null
}

async function enrichTrackArtists(tracks: TidalTrack[], token: string) {
  const cache = new Map<string, string>()

  return Promise.all(tracks.map(async (track) => {
    if (track.artist && track.artist !== 'Unknown artist') {
      return track
    }

    const cached = cache.get(track.id)
    if (cached) {
      return { ...track, artist: cached }
    }

    const artist = (await fetchArtistName(track.id, token)) || track.artist || 'Unknown artist'
    cache.set(track.id, artist)
    return { ...track, artist }
  }))
}

function extractArtistNames(payload: unknown, included = collectIncludedResources(payload)) {
  const names: string[] = []

  const addFromResource = (resource: unknown) => {
    if (!resource || typeof resource !== 'object') return
    const record = resource as TidalJson
    const type = readString(record.type)
    if (type && type !== 'artists') return
    const name = normalizeArtistFromResource(record)
    if (name) names.push(name)
  }

  if (payload && typeof payload === 'object') {
    const record = payload as TidalJson

    if (Array.isArray(record.data)) {
      for (const item of record.data) addFromResource(item)
    } else {
      addFromResource(record.data)
    }

    if (Array.isArray(record.included)) {
      for (const item of record.included) addFromResource(item)
    }
  }

  if (!names.length) {
    for (const resource of included.values()) {
      addFromResource(resource)
    }
  }

  return [...new Set(names)]
}

export async function searchTidalTracks(query: string, options: { limit?: number; playlistOnly?: boolean } = {}) {
  const token = await getTidalAccessToken()
  if (!token) {
    return []
  }

  const trimmed = query.trim()
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100)
  const paths = [
    `/searchSuggestions/${encodeURIComponent(trimmed)}`,
  ]

  const payload = await fetchTidalJson(paths, token, { query: trimmed, limit })
  if (!payload) return []

  return enrichTrackArtists(extractTidalTracks(payload), token)
}

function extractPlaylistId(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return null

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

function getTidalBrowserToken() {
  return process.env.TIDAL_BROWSER_TOKEN?.trim() || ''
}

export async function fetchTidalPlaylistTracks(playlistUrl: string, options: { limit?: number } = {}) {
  const playlistId = extractPlaylistId(playlistUrl)
  if (!playlistId) {
    return []
  }

  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500)
  const browserToken = getTidalBrowserToken()

  if (browserToken) {
    const payload = await fetchTidalJson([
      `/v1/playlists/${playlistId}/items`,
    ], '', {
      limit,
      params: {
        offset: '0',
        locale: 'en_US',
        deviceType: 'BROWSER',
      },
      headers: {
        accept: 'application/json',
        'x-tidal-token': browserToken,
        referer: `https://tidal.com/playlist/${playlistId}`,
        'user-agent': 'Mozilla/5.0',
      },
    })

    if (payload) {
      return extractTidalTracks(payload)
    }
  }

  const token = await getTidalAccessToken()
  if (!token) {
    return []
  }

  const payload = await fetchTidalJson([
    `/playlists/${playlistId}/relationships/items`,
  ], token, { limit })

  if (!payload) {
    return []
  }

  return enrichTrackArtists(extractTidalTracks(payload), token)
}
