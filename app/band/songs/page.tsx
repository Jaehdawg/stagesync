import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { AdminRowDialog } from '@/components/admin-row-dialog'
import { AutoRefresh } from '@/components/auto-refresh'
import { getTestSession } from '@/lib/test-session'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { bandCopy } from '@/content/en/band'

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

  const liveAccess = await getLiveBandAccessContext(supabase, serviceSupabase, { requireAdmin: false })
  let accessGranted = false
  let username = ''
  let activeBandId: string | null = null

  if (liveAccess) {
    accessGranted = true
    username = liveAccess.username
    activeBandId = liveAccess.bandId
  } else if (testSession?.role === 'band' || testSession?.role === 'admin') {
    accessGranted = true
    username = testSession.username
    activeBandId = testSession.activeBandId ?? null
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
          No active band selected.
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
              <p className="mt-3 max-w-2xl text-slate-300">Manage the band’s song list, import from CSV, Google Sheets, or Tidal, and keep the singer picker fast.</p>
              {username ? <p className="mt-2 text-sm text-slate-400">Signed in as <span className="font-semibold text-slate-200">{username}</span>.</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/band" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">{bandCopy.login.backToDashboard}</Link>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">Log out</button>
              </form>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Import songs</h2>
          <p className="mt-2 text-sm text-slate-300">Every import lands in the same songs table, so singers can search one library no matter where the list came from.</p>
          {importState === 'queued' && importJob ? (
            <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              <p className="font-semibold">Tidal import queued</p>
              <p className="mt-1 text-cyan-50/90">{importJob.message ?? 'The background job is processing the playlist now.'}</p>
              <p className="mt-1 text-cyan-50/70">Progress: {importJob.processed_items ?? 0}/{importJob.total_items ?? 0} · Imported {importJob.imported_items ?? 0}</p>
              {importJob.error_message ? <p className="mt-1 text-rose-200">Error: {importJob.error_message}</p> : null}
            </div>
          ) : null}
          {importState === 'queued' ? <AutoRefresh enabled intervalMs={4000} /> : null}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <form className="rounded-2xl border border-white/10 bg-slate-950/50 p-5" action="/api/band/songs/import" method="post" encType="multipart/form-data">
              <input type="hidden" name="importType" value="csv" />
              <h3 className="text-lg font-semibold text-white">Upload CSV</h3>
              <p className="mt-1 text-sm text-slate-400">Columns: Artist, Song Title, Duration.</p>
              <div className="mt-4 space-y-2">
                <label htmlFor="song-csv" className="text-sm font-medium text-slate-200">CSV file</label>
                <input id="song-csv" name="csvFile" type="file" accept=".csv,text/csv" className="block w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950" />
              </div>
              <button type="submit" className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Import CSV</button>
            </form>

            <form className="rounded-2xl border border-white/10 bg-slate-950/50 p-5" action="/api/band/songs/import" method="post">
              <input type="hidden" name="importType" value="google_sheet" />
              <h3 className="text-lg font-semibold text-white">Import Google Sheet</h3>
              <p className="mt-1 text-sm text-slate-400">Paste a public sheet URL that has Artist, Song Title, Duration.</p>
              <div className="mt-4 space-y-2">
                <label htmlFor="sheet-url" className="text-sm font-medium text-slate-200">Sheet URL</label>
                <input id="sheet-url" name="sheetUrl" type="url" placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500" />
              </div>
              <button type="submit" className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Import Sheet</button>
            </form>

            <form className="rounded-2xl border border-white/10 bg-slate-950/50 p-5" action="/api/band/songs/import" method="post">
              <input type="hidden" name="importType" value="tidal_playlist" />
              <h3 className="text-lg font-semibold text-white">Import Tidal Playlist</h3>
              <p className="mt-1 text-sm text-slate-400">Paste a public Tidal playlist URL. The app will fetch Artist, Song Title, and Duration through the Tidal API flow.</p>
              <div className="mt-4 space-y-2">
                <label htmlFor="playlist-url" className="text-sm font-medium text-slate-200">Playlist URL</label>
                <input id="playlist-url" name="playlistUrl" type="url" placeholder="https://tidal.com/playlist/..." className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500" />
              </div>
              <button type="submit" className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Import Playlist</button>
            </form>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Add a song</h2>
          <p className="mt-2 text-sm text-slate-300">Manually create a song entry when it’s not coming from an import.</p>
          <form className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1.2fr_0.6fr_auto]" action="/api/band/songs" method="post">
            <div className="space-y-2"><label htmlFor="song-title" className="text-sm font-medium text-slate-200">Song title</label><input id="song-title" name="title" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Dreams" /></div>
            <div className="space-y-2"><label htmlFor="song-artist" className="text-sm font-medium text-slate-200">Artist</label><input id="song-artist" name="artist" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Fleetwood Mac" /></div>
            <div className="space-y-2"><label htmlFor="song-duration" className="text-sm font-medium text-slate-200">Duration (ms)</label><input id="song-duration" name="durationMs" type="number" min={0} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="300000" /></div>
            <div className="flex items-end"><button type="submit" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save song</button></div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="text-2xl font-semibold text-white">Song list</h2><p className="mt-2 text-sm text-slate-300">{count ?? 0} active songs in the library.</p></div>
            <form action="/band/songs" method="get" className="flex flex-wrap gap-2">
              <input type="search" name="q" defaultValue={q} placeholder="Search songs" className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500" />
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Search</button>
            </form>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <div className="divide-y divide-white/10">
              {songs?.length ? songs.map((song) => (
                <div key={song.id} className="grid gap-4 bg-slate-950/50 p-4 lg:grid-cols-[1.2fr_1.2fr_0.6fr_auto] lg:items-center">
                  <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Artist</p><p className="mt-1 text-base font-semibold text-white">{song.artist}</p><p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{song.source_type ?? 'uploaded'}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Song title</p><p className="mt-1 text-base font-semibold text-white">{song.title}</p>{song.source_ref ? <p className="mt-2 text-xs text-slate-500">Ref: {song.source_ref}</p> : null}</div>
                  <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Duration</p><p className="mt-1 text-base font-semibold text-white">{formatDuration(song.duration_ms)}</p></div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <AdminRowDialog triggerLabel="Edit" title={`Edit ${song.title}`}>
                      <form className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5" action={`/api/band/songs/${song.id}`} method="post">
                        <input type="hidden" name="action" value="update" />
                        <div className="space-y-2"><label className="text-sm font-medium text-slate-200" htmlFor={`song-title-${song.id}`}>Song title</label><input id={`song-title-${song.id}`} name="title" defaultValue={song.title} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" /></div>
                        <div className="space-y-2"><label className="text-sm font-medium text-slate-200" htmlFor={`song-artist-${song.id}`}>Artist</label><input id={`song-artist-${song.id}`} name="artist" defaultValue={song.artist} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" /></div>
                        <div className="space-y-2"><label className="text-sm font-medium text-slate-200" htmlFor={`song-duration-${song.id}`}>Duration (ms)</label><input id={`song-duration-${song.id}`} name="durationMs" type="number" min={0} defaultValue={song.duration_ms ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" /></div>
                        <div className="flex justify-end"><button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save</button></div>
                      </form>
                    </AdminRowDialog>
                    <form action={`/api/band/songs/${song.id}`} method="post"><input type="hidden" name="action" value="archive" /><button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">Archive</button></form>
                  </div>
                </div>
              )) : <div className="bg-slate-950/50 p-6 text-slate-400">No songs yet.</div>}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-300"><p>Page {currentPage} of {totalPages}</p><div className="flex gap-2">{currentPage > 1 ? <Link href={buildHref('/band/songs', { page: currentPage - 1, q })} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white">Previous</Link> : null}{currentPage < totalPages ? <Link href={buildHref('/band/songs', { page: currentPage + 1, q })} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white">Next</Link> : null}</div></div>
        </section>
      </div>
    </main>
  )
}
