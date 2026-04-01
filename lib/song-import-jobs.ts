import { createServiceClient } from '@/utils/supabase/service'
import { buildTidalPlaylistSongs, dedupeSongImportRecords, type SongImportRecord } from './song-library'

type SongImportJob = {
  id: string
  band_id: string
  source_type: 'tidal_playlist'
  source_url: string | null
  source_ref: string | null
}

type JobUpdate = {
  status?: 'queued' | 'running' | 'completed' | 'failed'
  message?: string | null
  error_message?: string | null
  total_items?: number
  processed_items?: number
  imported_items?: number
  started_at?: string | null
  finished_at?: string | null
}

async function updateJob(jobId: string, patch: JobUpdate) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('song_import_jobs').update(patch).eq('id', jobId)
  if (error) {
    throw new Error(error.message)
  }
}

async function upsertSongs(bandId: string, songs: SongImportRecord[]) {
  const supabase = createServiceClient()
  const uniqueSongs = dedupeSongImportRecords(songs)
  const { error } = await supabase.from('songs').upsert(
    uniqueSongs.map((song) => ({
      ...song,
      band_id: bandId,
      archived_at: null,
    })),
    { onConflict: 'band_id,id' }
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function createTidalPlaylistImportJob(bandId: string, playlistUrl: string) {
  const supabase = createServiceClient()
  const id = crypto.randomUUID()
  const sourceRef = playlistUrl.trim().match(/playlist\/([a-zA-Z0-9_-]+)/i)?.[1] ?? null

  const { error } = await supabase.from('song_import_jobs').insert({
    id,
    band_id: bandId,
    source_type: 'tidal_playlist',
    source_url: playlistUrl,
    source_ref: sourceRef,
    status: 'queued',
    total_items: 0,
    processed_items: 0,
    imported_items: 0,
    message: 'Queued for processing.',
  })

  if (error) {
    throw new Error(error.message)
  }

  return { id, sourceRef }
}

export async function runTidalPlaylistImportJob(job: SongImportJob) {
  try {
    await updateJob(job.id, {
      status: 'running',
      started_at: new Date().toISOString(),
      message: 'Fetching playlist from Tidal...',
      error_message: null,
    })

    const songs = await buildTidalPlaylistSongs(job.source_url ?? '')
    const uniqueSongs = dedupeSongImportRecords(songs)

    await updateJob(job.id, {
      total_items: uniqueSongs.length,
      processed_items: uniqueSongs.length,
      imported_items: uniqueSongs.length,
      message: uniqueSongs.length ? `Imported ${uniqueSongs.length} songs.` : 'No songs were imported.',
    })

    if (uniqueSongs.length) {
    await upsertSongs(job.band_id, uniqueSongs)
    }

    await updateJob(job.id, {
      status: 'completed',
      finished_at: new Date().toISOString(),
      message: uniqueSongs.length ? `Imported ${uniqueSongs.length} songs.` : 'No songs were imported.',
    })
  } catch (error) {
    await updateJob(job.id, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unable to import playlist.',
      message: 'Tidal import failed.',
    })
    throw error
  }
}

export function queueTidalPlaylistImport(job: SongImportJob) {
  void Promise.resolve().then(() => runTidalPlaylistImportJob(job)).catch(() => {
    // The job row already records failure; background scheduling should never throw to the request.
  })
}
