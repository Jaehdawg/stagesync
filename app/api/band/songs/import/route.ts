import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getTestSession } from '@/lib/test-session'
import {
  buildGoogleSheetExportUrl,
  extractGoogleSheetId,
  dedupeSongImportRecords,
  parseSongsCsv,
  type SongImportRecord,
} from '@/lib/song-library'
import { createTidalPlaylistImportJob, queueTidalPlaylistImport } from '@/lib/song-import-jobs'
import { getLiveBandAccessContext } from '@/lib/band-access'

const GOOGLE_SHEET_FETCH_TIMEOUT_MS = 10_000
const GOOGLE_SHEET_MAX_CHARS = 2_000_000

function getSupabase(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
        },
      },
    }
  )
}

async function readImportSongs(formData: FormData): Promise<SongImportRecord[]> {
  const importType = String(formData.get('importType') ?? '').trim()

  const csvFile = formData.get('csvFile')
  if (importType === 'csv' && csvFile instanceof File) {
    const text = await csvFile.text()
    return parseSongsCsv(text, 'uploaded', null)
  }

  const sheetUrl = String(formData.get('sheetUrl') ?? '').trim()
  if (importType === 'google_sheet' && sheetUrl) {
    const exportUrl = buildGoogleSheetExportUrl(sheetUrl)
    if (!exportUrl) {
      throw new Error('Invalid Google Sheet URL.')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), GOOGLE_SHEET_FETCH_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(exportUrl, { signal: controller.signal })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      throw new Error('Unable to fetch the Google Sheet export.')
    }

    const contentLength = Number(response.headers.get('content-length') ?? '0')
    if (Number.isFinite(contentLength) && contentLength > GOOGLE_SHEET_MAX_CHARS) {
      throw new Error('Google Sheet export is too large.')
    }

    const text = await response.text()
    if (text.length > GOOGLE_SHEET_MAX_CHARS) {
      throw new Error('Google Sheet export is too large.')
    }
    return parseSongsCsv(text, 'google_sheet', extractGoogleSheetId(sheetUrl))
  }

  return []
}

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  const authSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const formData = await request.formData()

  const bandId =
    testSession?.role === 'band' || testSession?.role === 'admin'
      ? testSession.activeBandId ?? null
      : (await getLiveBandAccessContext(authSupabase, serviceSupabase, { requireAdmin: true }))?.bandId ?? null

  if (!bandId) {
    return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
  }

  let songs: SongImportRecord[] = []
  try {
    songs = await readImportSongs(formData)
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to import songs.' }, { status: 400 })
  }

  const importType = String(formData.get('importType') ?? '').trim()
  if (importType === 'tidal_playlist') {
    const playlistUrl = String(formData.get('playlistUrl') ?? '').trim()
    if (!playlistUrl) {
      return NextResponse.json({ message: 'Playlist URL is required.' }, { status: 400 })
    }

    const job = await createTidalPlaylistImportJob(bandId, playlistUrl)
    queueTidalPlaylistImport({
      id: job.id,
      band_id: bandId,
      source_type: 'tidal_playlist',
      source_url: playlistUrl,
      source_ref: job.sourceRef,
    })

    return NextResponse.redirect(new URL(`/band/songs?import=queued&job=${job.id}`, request.url), { status: 303 })
  }

  if (!songs.length) {
    return NextResponse.json({ message: 'No valid songs found in the import.' }, { status: 400 })
  }

  const uniqueSongs = dedupeSongImportRecords(songs)
  const { error } = await serviceSupabase.from('songs').upsert(
    uniqueSongs.map((song) => ({
      ...song,
      band_id: bandId,
      archived_at: null,
    })),
    { onConflict: 'band_id,id' }
  )

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band/songs', request.url), { status: 303 })
}
