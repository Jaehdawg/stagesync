import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { isBandAdminRequest } from '@/lib/band-auth'
import { getTestSession } from '@/lib/test-session'
import {
  buildGoogleSheetExportUrl,
  extractGoogleSheetId,
  dedupeSongImportRecords,
  parseSongsCsv,
  type SongImportRecord,
} from '@/lib/song-library'
import { createTidalPlaylistImportJob, queueTidalPlaylistImport } from '@/lib/song-import-jobs'

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

    const response = await fetch(exportUrl)
    if (!response.ok) {
      throw new Error('Unable to fetch the Google Sheet export.')
    }

    const text = await response.text()
    return parseSongsCsv(text, 'google_sheet', extractGoogleSheetId(sheetUrl))
  }

  return []
}

export async function POST(request: NextRequest) {
  if (!(await isBandAdminRequest(request))) {
    return NextResponse.json({ message: 'Band access required.' }, { status: 401 })
  }

  const testSession = await getTestSession()
  if (!testSession?.activeBandId) {
    return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
  }

  const formData = await request.formData()

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

    const job = await createTidalPlaylistImportJob(testSession.activeBandId, playlistUrl)
    queueTidalPlaylistImport({
      id: job.id,
      band_id: testSession.activeBandId,
      source_type: 'tidal_playlist',
      source_url: playlistUrl,
      source_ref: job.sourceRef,
    })

    return NextResponse.redirect(new URL(`/band/songs?import=queued&job=${job.id}`, request.url), { status: 303 })
  }

  if (!songs.length) {
    return NextResponse.json({ message: 'No valid songs found in the import.' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()
  const uniqueSongs = dedupeSongImportRecords(songs)
  const { error } = await serviceSupabase.from('songs').upsert(
    uniqueSongs.map((song) => ({
      ...song,
      band_id: testSession.activeBandId,
      archived_at: null,
    })),
    { onConflict: 'band_id,id' }
  )

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band/songs', request.url), { status: 303 })
}
