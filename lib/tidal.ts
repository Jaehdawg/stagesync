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

function parseDurationSeconds(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    const isoMatch = trimmed.match(/^PT(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i)
    if (isoMatch) {
      const minutes = Number(isoMatch[1] ?? 0)
      const seconds = Number(isoMatch[2] ?? 0)
      return minutes * 60 + seconds
    }

    const numeric = Number(trimmed)
    if (Number.isFinite(numeric)) {
      return numeric
    }
  }

  return null
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

    const relationships = (record.relationships as TidalJson | undefined) ?? {}
    const items = relationships.items as TidalJson | undefined
    if (Array.isArray(items?.data)) {
      for (const resource of items.data) add(resource)
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

async function fetchArtistName(artistId: string, token: string) {
  const payload = await fetchTidalJson([
    `/artists/${artistId}`,
  ], token, { limit: 1 })

  if (!payload) {
    return ''
  }

  const record = payload as TidalJson
  const data = (record.data as TidalJson | undefined) ?? {}
  return readString((data.attributes as TidalJson | undefined)?.name ?? data.name)
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
  const duration = parseDurationSeconds(durationValue)
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

    const relationships = (record.relationships as TidalJson | undefined) ?? {}
    const itemsRelationship = relationships.items as TidalJson | undefined
    candidates.push(itemsRelationship?.data)

    if (record.data && typeof record.data === 'object') {
      const dataRelationships = ((record.data as TidalJson).relationships as TidalJson | undefined) ?? {}
      const dataItemsRelationship = dataRelationships.items as TidalJson | undefined
      candidates.push(dataItemsRelationship?.data)
    }

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
    if (!candidate) continue
    const items = Array.isArray(candidate) ? candidate : [candidate]
    for (const item of items) {
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
  options: { query?: string; limit: number; params?: Record<string, string>; headers?: Record<string, string>; retries?: number; include?: string }
): Promise<TidalJson | null> {
  const { query, limit, params, headers: extraHeaders, retries = 2, include } = options

  for (const path of paths) {
    const url = new URL(path.replace(/^\//, ''), getTidalBaseUrl())
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

    if (include) {
      url.searchParams.set('include', include)
    } else if (path.startsWith('/searchSuggestions/')) {
      url.searchParams.set('include', 'directHits')
    } else if (path.startsWith('/playlists/')) {
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

    if (response.status === 429 && retries > 0) {
      const retryAfterHeader = response.headers.get('retry-after')
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN
      const delayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : 500

      await new Promise((resolve) => setTimeout(resolve, delayMs))
      const retried = await fetchTidalJson([path], token, {
        query,
        limit,
        params,
        headers: extraHeaders,
        include,
        retries: retries - 1,
      })

      if (retried) {
        return retried
      }
    }

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

function extractNextPlaylistCursor(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null

  const record = payload as TidalJson
  const candidates: unknown[] = [
    record.links,
    (record.data as TidalJson | undefined)?.links,
    ((record.data as TidalJson | undefined)?.relationships as TidalJson | undefined)?.items,
    (record.relationships as TidalJson | undefined)?.items,
  ]

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue
    const linkRecord = candidate as TidalJson
    const next = linkRecord.next ?? (linkRecord.links as TidalJson | undefined)?.next
    if (typeof next === 'string' && next.trim()) {
      return next.trim()
    }
  }

  return null
}

export async function fetchTidalPlaylistTracks(playlistUrl: string, options: { limit?: number } = {}) {
  const playlistId = extractPlaylistId(playlistUrl)
  if (!playlistId) {
    return []
  }

  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500)

  const token = await getTidalAccessToken()
  if (!token) {
    return []
  }

  const pageSize = Math.min(limit, 20)
  const tracks: TidalTrack[] = []
  let offset = 0
  let nextUrl: string | null = null
  let total = Number.POSITIVE_INFINITY

  while (tracks.length < total) {
    const playlistPayload = nextUrl
      ? await fetchTidalJson([nextUrl], token, { limit: pageSize, include: 'items,items.artists' })
      : await fetchTidalJson([
          `/playlists/${playlistId}`,
        ], token, {
          limit: pageSize,
          params: { offset: String(offset) },
          include: 'items,items.artists',
        })

    if (!playlistPayload) {
      break
    }

    const playlistRecord = playlistPayload as TidalJson
    const playlistData = (playlistRecord.data as TidalJson | undefined) ?? {}
    const playlistAttributes = (playlistData.attributes as TidalJson | undefined) ?? {}
    const reportedTotal = Number(playlistAttributes.numberOfItems ?? playlistRecord.totalNumberOfItems)
    if (Number.isFinite(reportedTotal) && reportedTotal >= 0) {
      total = reportedTotal
    }

    const pageTracks = extractTidalTracks(playlistPayload)

    if (!pageTracks.length) {
      break
    }

    tracks.push(...pageTracks)

    nextUrl = extractNextPlaylistCursor(playlistPayload)

    if (nextUrl) {
      continue
    }

    if (pageTracks.length < pageSize) {
      total = tracks.length
      break
    }

    offset += pageSize
  }

  return tracks
}
