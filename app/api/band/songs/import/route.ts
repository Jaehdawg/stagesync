import { NextResponse, type NextRequest } from 'next/server'
import { getTestSession } from '@/lib/test-session'
import { createServiceClient } from '@/utils/supabase/service'

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

function parseDurationMs(input: string) {
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

function slugifySong(title: string, artist: string, index: number) {
  const base = `${title}-${artist}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return base || `song-${index}`
}

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  if (!testSession || (testSession.role !== 'band' && testSession.role !== 'admin')) {
    return NextResponse.json({ message: 'Testing login required.' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('csvFile')

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'CSV file is required.' }, { status: 400 })
  }

  const text = await file.text()
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (!lines.length) {
    return NextResponse.json({ message: 'CSV file is empty.' }, { status: 400 })
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader)
  const titleIndex = headers.findIndex((header) => header === 'songtitle' || header === 'title' || header === 'song')
  const artistIndex = headers.findIndex((header) => header === 'artist' || header === 'performer')
  const durationIndex = headers.findIndex((header) => header === 'songduration' || header === 'duration' || header === 'length')

  if (titleIndex === -1 || artistIndex === -1) {
    return NextResponse.json({ message: 'CSV needs Song Title and Artist columns.' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()
  const rows = lines.slice(1).map((line) => splitCsvLine(line))
  const songs = rows
    .map((row, index) => {
      const title = row[titleIndex]?.trim() ?? ''
      const artist = row[artistIndex]?.trim() ?? ''
      const durationMs = durationIndex >= 0 ? parseDurationMs(row[durationIndex] ?? '') : null

      if (!title || !artist) return null

      return {
        id: slugifySong(title, artist, index + 1),
        title,
        artist,
        duration_ms: durationMs,
      }
    })
    .filter((song): song is { id: string; title: string; artist: string; duration_ms: number | null } => Boolean(song))

  if (!songs.length) {
    return NextResponse.json({ message: 'No valid songs found in the CSV.' }, { status: 400 })
  }

  const { error } = await serviceSupabase.from('songs').upsert(songs, { onConflict: 'id' })
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band', request.url))
}
