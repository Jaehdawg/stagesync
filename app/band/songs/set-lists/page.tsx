import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { AdminRowDialog } from '@/components/admin-row-dialog'
import { SetListSongEditor } from '@/components/set-list-song-editor'
import { getTestSession } from '@/lib/test-session'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { listBandSetLists, getBandSetListSongs } from '@/lib/set-lists'
import { bandCopy } from '@/content/en/band'
import { bandSetListsCopy } from '@/content/en/components/band-set-lists'

export default async function BandSetListsPage() {
  const testSession = await getTestSession()
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  const liveAccess = await getLiveBandAccessContext(supabase, serviceSupabase, { requireAdmin: true })
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
            <h1 className="mt-2 text-4xl font-semibold text-white">{bandSetListsCopy.title}</h1>
            <p className="mt-3 max-w-2xl text-slate-300">Band admin access required.</p>
          </header>
          <BandAccessForm role="band" title={bandCopy.login.title} description={bandCopy.login.description} submitLabel={bandCopy.login.submitLabel} successMessage={bandCopy.login.successMessage} />
        </div>
      </main>
    )
  }

  if (!activeBandId) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
          {bandCopy.songsPage.noBandSelected}
        </div>
      </main>
    )
  }

  const setLists = await listBandSetLists(activeBandId)
  const setListSongs = await Promise.all(
    setLists.map(async (setList) => {
      const rows = await getBandSetListSongs(activeBandId, setList.id)
      const songIds = rows.map((row) => row.song_id)
      const { data: songs } = await serviceSupabase.from('songs').select('id, title, artist').eq('band_id', activeBandId).in('id', songIds)
      const orderedSongs = songIds
        .map((songId) => (songs ?? []).find((song: { id: string; title: string; artist: string }) => song.id === songId))
        .filter((song): song is { id: string; title: string; artist: string } => Boolean(song))
      return { setList, songs: orderedSongs }
    })
  )

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{bandCopy.bandPortal}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{bandSetListsCopy.title}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{bandSetListsCopy.useSetListNote}</p>
              {username ? <p className="mt-2 text-sm text-slate-400">{bandCopy.songsPage.signedInAs} <span className="font-semibold text-slate-200">{username}</span>.</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/band/songs" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">Back to songs</Link>
              <Link href="/band" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">{bandCopy.login.backToDashboard}</Link>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">{bandSetListsCopy.title}</h2>
          <p className="mt-2 text-sm text-slate-300">Create new set lists from the Song Library flow, then manage them here.</p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
            <p>{bandSetListsCopy.createWithSongNote}</p>
            <p className="mt-2">Use the Song Library to seed a new set list with songs, or add songs into an existing set list without overwriting what is already there.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">{bandSetListsCopy.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{setLists.length ? `${setLists.length} set lists` : bandSetListsCopy.empty}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {setListSongs.length ? setListSongs.map(({ setList, songs }) => (
              <div key={setList.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{setList.name}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${setList.is_active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-slate-300'}`}>{setList.is_active ? bandSetListsCopy.activeBadge : bandSetListsCopy.inactiveBadge}</span>
                    </div>
                    {setList.description ? <p className="mt-2 text-sm text-slate-300">{setList.description}</p> : null}
                    {setList.notes ? <p className="mt-2 text-xs text-slate-400">{setList.notes}</p> : null}
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{songs.length} songs</p>
                  </div>
                  <div className="flex flex-wrap gap-2" onClickCapture={(event) => event.stopPropagation()}>
                    <form action={`/api/band/set-lists/${setList.id}`} method="post">
                      <input type="hidden" name="action" value={setList.is_active ? 'deactivate' : 'activate'} />
                      <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white">{setList.is_active ? bandSetListsCopy.deactivate : bandSetListsCopy.activate}</button>
                    </form>
                    <form action={`/api/band/set-lists/${setList.id}`} method="post">
                      <input type="hidden" name="action" value="copy" />
                      <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white">{bandSetListsCopy.copy}</button>
                    </form>
                    <AdminRowDialog triggerLabel={bandSetListsCopy.delete} title={bandSetListsCopy.confirmDeleteTitle}>
                      <form action={`/api/band/set-lists/${setList.id}`} method="post" className="space-y-4">
                        <input type="hidden" name="action" value="delete" />
                        <p className="text-sm text-slate-300">{bandSetListsCopy.confirmDeleteBody}</p>
                        <div className="flex justify-end gap-2">
                          <button type="submit" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200">{bandSetListsCopy.confirmDeleteButton}</button>
                        </div>
                      </form>
                    </AdminRowDialog>
                  </div>
                </div>
                <div onClickCapture={(event) => event.stopPropagation()}>
                  <SetListSongEditor setListId={setList.id} songs={songs} />
                </div>
              </div>
            )) : <p className="text-sm text-slate-400">{bandSetListsCopy.empty}</p>}
          </div>
        </section>
      </div>
    </main>
  )
}
