import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { AdminRowDialog } from '@/components/admin-row-dialog'
import { AutoRefresh } from '@/components/auto-refresh'
import { DeleteAllSongsButton } from '@/components/delete-all-songs-button'
import { getTestSession } from '@/lib/test-session'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { bandCopy } from '@/content/en/band'
import { authCopy } from '@/content/en/auth'
import { sharedCopy } from '@/content/en/shared'

type SearchParams = Record<string, string | string[] | undefined>

function formatDuration(durationMs: number | null) {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs <= 0) {
    return '—'
  }

  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function buildHref(base: string, params: { page?: number; q?: string }) {
  const search = new URLSearchParams()
  if (params.page && params.page > 1) search.set('page', String(params.page))
  if (params.q) search.set('q', params.q)
  const query = search.toString()
  return query ? `${base}?${query}` : base
}

export default async function BandSongsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const testSession = await getTestSession()
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()
  const params = await searchParams
  const page = Math.max(1, Number(typeof params?.page === 'string' ? params.page : '1') || 1)
  const q = typeof params?.q === 'string' ? params.q.trim() : ''
  const importState = typeof params?.import === 'string' ? params.import : ''
  const importJobId = typeof params?.job === 'string' ? params.job.trim() : ''
  const deletedAll = typeof params?.deleted === 'string' ? params.deleted === 'all' : false

  const liveAccess = await getLiveBandAccessContext(supabase, serviceSupabase, { requireAdmin: false })
  let accessGranted = false
  let username = ''
  let activeBandId: string | null = null
  let bandRole: 'admin' | 'member' = 'member'

  if (liveAccess) {
    accessGranted = true
    username = liveAccess.username
    activeBandId = liveAccess.bandId
    bandRole = liveAccess.bandRole
  } else if (testSession?.role === 'band' || testSession?.role === 'admin') {
    accessGranted = true
    username = testSession.username
    activeBandId = testSession.activeBandId ?? null
    bandRole = testSession.role === 'admin' ? 'admin' : 'member'
  }

  if (!accessGranted) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{bandCopy.bandPortal}</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">{bandCopy.login.songsTitle}</h1>
            <p className="mt-3 max-w-2xl text-slate-300">{bandCopy.login.loginRequired}</p>
          </header>
          <BandAccessForm role="band" title={bandCopy.login.title} description={bandCopy.login.songsDescription} submitLabel={bandCopy.login.submitLabel} successMessage={bandCopy.login.successMessage} />
        </div>
      </main>
    )
  }

  const pageSize = 12
  const offset = (page - 1) * pageSize

  if (!activeBandId) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
          {sharedCopy.noActiveBandSelected}
        </div>
      </main>
    )
  }

  const { data: importJob } = importState && importJobId
    ? await serviceSupabase
      .from('song_import_jobs')
      .select('id, status, message, error_message, processed_items, imported_items, total_items, source_url')
      .eq('band_id', activeBandId)
      .eq('id', importJobId)
      .maybeSingle()
    : { data: null }

  let query = serviceSupabase
    .from('songs')
    .select('id, title, artist, duration_ms, source_type, source_ref', { count: 'exact' })
    .is('archived_at', null)
    .eq('band_id', activeBandId)
    .order('artist', { ascending: true })
    .order('title', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (q) {
    query = query.or(`title.ilike.%${q}%,artist.ilike.%${q}%`)
  }

  const { data: songs, count, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))
  const currentPage = Math.min(page, totalPages)

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{bandCopy.bandPortal}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{bandCopy.login.songsTitle}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{bandCopy.songsPage.mainDescription}</p>
              {username ? <p className="mt-2 text-sm text-slate-400">{bandCopy.songsPage.signedInAs} <span className="font-semibold text-slate-200">{username}</span>.</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/band" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">{bandCopy.login.backToDashboard}</Link>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">{authCopy.logoutLabel}</button>
              </form>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">{bandCopy.songsPage.importSongsTitle}</h2>
          <p className="mt-2 text-sm text-slate-300">{bandCopy.songsPage.importSongsDescription}</p>
          {importState === 'queued' && importJob ? (
            <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              <p className="font-semibold">{bandCopy.songsPage.importQueuedTitle}</p>
              <p className="mt-1 text-cyan-50/90">{importJob.message ?? bandCopy.songsPage.importQueuedProcessing}</p>
              <p className="mt-1 text-cyan-50/70">{bandCopy.songsPage.importQueuedProgress}: {importJob.processed_items ?? 0}/{importJob.total_items ?? 0} · Imported {importJob.imported_items ?? 0}</p>
              {importJob.error_message ? <p className="mt-1 text-rose-200">{bandCopy.songsPage.importQueuedErrorPrefix} {importJob.error_message}</p> : null}
            </div>
          ) : null}
          {importState === 'queued' ? <AutoRefresh enabled intervalMs={4000} /> : null}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <form className="rounded-2xl border border-white/10 bg-slate-950/50 p-5" action="/api/band/songs/import" method="post" encType="multipart/form-data">
              <input type="hidden" name="importType" value="csv" />
              <h3 className="text-lg font-semibold text-white">{bandCopy.songsPage.uploadCsvTitle}</h3>
              <p className="mt-1 text-sm text-slate-400">{bandCopy.songsPage.csvColumns}</p>
              <div className="mt-4 space-y-2">
                <label htmlFor="song-csv" className="text-sm font-medium text-slate-200">{bandCopy.songsPage.csvFileLabel}</label>
                <input id="song-csv" name="csvFile" type="file" accept=".csv,text/csv" className="block w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950" />
              </div>
              <button type="submit" className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{bandCopy.songsPage.importCsvButton}</button>
            </form>

            <form className="rounded-2xl border border-white/10 bg-slate-950/50 p-5" action="/api/band/songs/import" method="post">
              <input type="hidden" name="importType" value="google_sheet" />
              <h3 className="text-lg font-semibold text-white">{bandCopy.songsPage.importSheetTitle}</h3>
              <p className="mt-1 text-sm text-slate-400">{bandCopy.songsPage.sheetDescription}</p>
              <div className="mt-4 space-y-2">
                <label htmlFor="sheet-url" className="text-sm font-medium text-slate-200">{bandCopy.songsPage.sheetUrlLabel}</label>
                <input id="sheet-url" name="sheetUrl" type="url" placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500" />
              </div>
              <button type="submit" className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{bandCopy.songsPage.importSheetButton}</button>
            </form>

            <form className="rounded-2xl border border-white/10 bg-slate-950/50 p-5" action="/api/band/songs/import" method="post">
              <input type="hidden" name="importType" value="tidal_playlist" />
              <h3 className="text-lg font-semibold text-white">{bandCopy.songsPage.importTidalTitle}</h3>
              <p className="mt-1 text-sm text-slate-400">{bandCopy.songsPage.tidalDescription}</p>
              <div className="mt-4 space-y-2">
                <label htmlFor="playlist-url" className="text-sm font-medium text-slate-200">{bandCopy.songsPage.playlistUrlLabel}</label>
                <input id="playlist-url" name="playlistUrl" type="url" placeholder="https://tidal.com/playlist/..." className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500" />
              </div>
              <button type="submit" className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{bandCopy.songsPage.importPlaylistButton}</button>
            </form>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">{bandCopy.songsPage.addSongTitle}</h2>
          <p className="mt-2 text-sm text-slate-300">{bandCopy.songsPage.addSongDescription}</p>
          <form className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1.2fr_0.6fr_auto]" action="/api/band/songs" method="post">
            <div className="space-y-2"><label htmlFor="song-title" className="text-sm font-medium text-slate-200">{bandCopy.songsPage.songTitleLabel}</label><input id="song-title" name="title" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Dreams" /></div>
            <div className="space-y-2"><label htmlFor="song-artist" className="text-sm font-medium text-slate-200">{bandCopy.songsPage.artistLabel}</label><input id="song-artist" name="artist" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Fleetwood Mac" /></div>
            <div className="space-y-2"><label htmlFor="song-duration" className="text-sm font-medium text-slate-200">{bandCopy.songsPage.durationLabel}</label><input id="song-duration" name="durationMs" type="number" min={0} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="300000" /></div>
            <div className="flex items-end"><button type="submit" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{bandCopy.songsPage.saveSongButton}</button></div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="text-2xl font-semibold text-white">{bandCopy.songsPage.songListTitle}</h2><p className="mt-2 text-sm text-slate-300">{count ?? 0} {bandCopy.songsPage.activeSongsSuffix}</p></div>
            <form action="/band/songs" method="get" className="flex flex-wrap gap-2">
              <input type="search" name="q" defaultValue={q} placeholder={bandCopy.songsPage.searchPlaceholder} className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500" />
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{bandCopy.songsPage.searchButton}</button>
            </form>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {bandRole === 'admin' ? (
              <DeleteAllSongsButton
                label={bandCopy.songsPage.deleteAllSongsButton}
                confirmText={`${bandCopy.songsPage.deleteAllSongsConfirmTitle}\n\n${bandCopy.songsPage.deleteAllSongsConfirmBody}`}
              />
            ) : null}
            {deletedAll ? <p className="text-sm text-emerald-300">{bandCopy.songsPage.deleteAllSongsArchivedMessage}</p> : null}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <div className="divide-y divide-white/10">
              {songs?.length ? songs.map((song) => (
                <div key={song.id} className="grid gap-4 bg-slate-950/50 p-4 lg:grid-cols-[1.2fr_1.2fr_0.6fr_auto] lg:items-center">
                  <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">{bandCopy.songsPage.rowArtistLabel}</p><p className="mt-1 text-base font-semibold text-white">{song.artist}</p><p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{song.source_type ?? bandCopy.songsPage.sourceUploaded}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">{bandCopy.songsPage.rowSongTitleLabel}</p><p className="mt-1 text-base font-semibold text-white">{song.title}</p>{song.source_ref ? <p className="mt-2 text-xs text-slate-500">{bandCopy.songsPage.sourceRefPrefix} {song.source_ref}</p> : null}</div>
                  <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">{bandCopy.songsPage.rowDurationLabel}</p><p className="mt-1 text-base font-semibold text-white">{formatDuration(song.duration_ms)}</p></div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <AdminRowDialog triggerLabel={bandCopy.songsPage.editButton} title={`Edit ${song.title}`}>
                      <form className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5" action={`/api/band/songs/${song.id}`} method="post">
                        <input type="hidden" name="action" value="update" />
                        <div className="space-y-2"><label className="text-sm font-medium text-slate-200" htmlFor={`song-title-${song.id}`}>{bandCopy.songsPage.songTitleLabel}</label><input id={`song-title-${song.id}`} name="title" defaultValue={song.title} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" /></div>
                        <div className="space-y-2"><label className="text-sm font-medium text-slate-200" htmlFor={`song-artist-${song.id}`}>{bandCopy.songsPage.artistLabel}</label><input id={`song-artist-${song.id}`} name="artist" defaultValue={song.artist} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" /></div>
                        <div className="space-y-2"><label className="text-sm font-medium text-slate-200" htmlFor={`song-duration-${song.id}`}>{bandCopy.songsPage.durationLabel}</label><input id={`song-duration-${song.id}`} name="durationMs" type="number" min={0} defaultValue={song.duration_ms ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" /></div>
                        <div className="flex justify-end"><button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{bandCopy.songsPage.saveButton}</button></div>
                      </form>
                    </AdminRowDialog>
                    <form action={`/api/band/songs/${song.id}`} method="post"><input type="hidden" name="action" value="archive" /><button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">{bandCopy.songsPage.archiveButton}</button></form>
                  </div>
                </div>
              )) : <div className="bg-slate-950/50 p-6 text-slate-400">{bandCopy.songsPage.noSongs}</div>}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-300"><p>{bandCopy.songsPage.pageLabel} {currentPage} of {totalPages}</p><div className="flex gap-2">{currentPage > 1 ? <Link href={buildHref('/band/songs', { page: currentPage - 1, q })} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white">{bandCopy.songsPage.previousButton}</Link> : null}{currentPage < totalPages ? <Link href={buildHref('/band/songs', { page: currentPage + 1, q })} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white">{bandCopy.songsPage.nextButton}</Link> : null}</div></div>
        </section>
      </div>
    </main>
  )
}
