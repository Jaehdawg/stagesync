import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { isBandAdminRequest } from '@/lib/band-auth'
import {
  buildGoogleSheetExportUrl,
  buildTidalPlaylistSongs,
  extractGoogleSheetId,
  parseSongsCsv,
  type SongImportRecord,
} from '@/lib/song-library'

async function readImportSongs(formData: FormData): Promise<SongImportRecord[]> {
  const csvFile = formData.get('csvFile')
  if (csvFile instanceof File) {
    const text = await csvFile.text()
    return parseSongsCsv(text, 'uploaded', null)
  }

  const sheetUrl = String(formData.get('sheetUrl') ?? '').trim()
  if (sheetUrl) {
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

  const playlistUrl = String(formData.get('playlistUrl') ?? '').trim()
  if (playlistUrl) {
    return buildTidalPlaylistSongs(playlistUrl)
  }

  return []
}

export async function POST(request: NextRequest) {
  if (!(await isBandAdminRequest(request))) {
    return NextResponse.json({ message: 'Band access required.' }, { status: 401 })
  }

  const formData = await request.formData()

  let songs: SongImportRecord[] = []
  try {
    songs = await readImportSongs(formData)
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to import songs.' }, { status: 400 })
  }

  if (!songs.length) {
    return NextResponse.json({ message: 'No valid songs found in the import.' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()
  const { error } = await serviceSupabase.from('songs').upsert(
    songs.map((song) => ({
      ...song,
      archived_at: null,
    })),
    { onConflict: 'id' }
  )

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band/songs', request.url), { status: 303 })
}
