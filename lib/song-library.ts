import { fetchTidalPlaylistTracks } from './tidal'

export type SongSourceType = 'uploaded' | 'google_sheet' | 'tidal_playlist' | 'manual'

export type SongImportRecord = {
  id: string
  title: string
  artist: string
  duration_ms: number | null
  source_type: SongSourceType
  source_ref: string | null
}

export function dedupeSongImportRecords(songs: SongImportRecord[]) {
  const unique = new Map<string, SongImportRecord>()
  for (const song of songs) {
    if (!song?.id) continue
    if (!unique.has(song.id)) {
      unique.set(song.id, song)
    }
  }
  return [...unique.values()]
}

function splitCsvLine(line: string) {
  const values: string[] = []
  let current = ''
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (quoted && next === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
      continue
    }

    if (char === ',' && !quoted) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export function slugifySongId(title: string, artist: string) {
  return `${title}-${artist}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'song'
}

export function parseDurationMs(input: string) {
  const value = input.trim()
  if (!value) return null
  if (/^\d+$/.test(value)) {
    const numeric = Number(value)
    return numeric < 1000 ? numeric * 1000 : numeric
  }

  const parts = value.split(':').map((part) => Number(part))
  if (parts.some((part) => Number.isNaN(part))) return null
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000
  if (parts.length === 3) return ((parts[0] * 60 + parts[1]) * 60 + parts[2]) * 1000
  return null
}

export function parseSongsCsv(text: string, sourceType: SongSourceType = 'uploaded', sourceRef: string | null = null): SongImportRecord[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (!lines.length) {
    return []
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader)
  const titleIndex = headers.findIndex((header) => header === 'songtitle' || header === 'title' || header === 'song')
  const artistIndex = headers.findIndex((header) => header === 'artist' || header === 'performer')
  const durationIndex = headers.findIndex((header) => header === 'songduration' || header === 'duration' || header === 'length')

  if (titleIndex === -1 || artistIndex === -1) {
    return []
  }

  return lines.slice(1).map((line) => splitCsvLine(line)).map((row) => {
    const title = row[titleIndex]?.trim() ?? ''
    const artist = row[artistIndex]?.trim() ?? ''
    const durationMs = durationIndex >= 0 ? parseDurationMs(row[durationIndex] ?? '') : null

    if (!title || !artist) {
      return null
    }

    return {
      id: slugifySongId(title, artist),
      title,
      artist,
      duration_ms: durationMs,
      source_type: sourceType,
      source_ref: sourceRef,
    }
  }).filter((song): song is SongImportRecord => Boolean(song))
}

export function buildGoogleSheetExportUrl(sheetUrl: string) {
  const trimmed = sheetUrl.trim()
  if (!trimmed) return null

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i)
  if (!match) {
    return null
  }

  const sheetId = match[1]
  const gidMatch = trimmed.match(/[?#&]gid=(\d+)/i)
  const gid = gidMatch?.[1] ?? '0'
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
}

export function extractGoogleSheetId(sheetUrl: string) {
  return sheetUrl.trim().match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i)?.[1] ?? null
}

export async function buildTidalPlaylistSongs(playlistUrl: string): Promise<SongImportRecord[]> {
  const playlistTracks = await fetchTidalPlaylistTracks(playlistUrl)
  const playlistId = playlistUrl.trim().match(/playlist\/([a-zA-Z0-9_-]+)/i)?.[1] ?? null

  return dedupeSongImportRecords(playlistTracks
    .filter((track) => Boolean(track.title?.trim()) && Boolean(track.artist?.trim()))
    .map((track) => ({
      id: slugifySongId(track.title, track.artist),
      title: track.title,
      artist: track.artist,
      duration_ms: typeof track.duration === 'number' && Number.isFinite(track.duration) ? Math.floor(track.duration * 1000) : null,
      source_type: 'tidal_playlist' as const,
      source_ref: playlistId,
    }))
  )
}
