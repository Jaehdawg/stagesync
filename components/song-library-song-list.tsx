'use client'

import type { RefObject } from 'react'
import { useMemo, useRef, useState } from 'react'

import { AdminRowDialog } from '@/components/admin-row-dialog'
import { bandCopy } from '@/content/en/band'
import { bandSetListsCopy } from '@/content/en/components/band-set-lists'

type Song = {
  id: string
  artist: string
  title: string
  duration_ms: number | null
  source_type?: string | null
}

type SetListOption = {
  id: string
  name: string
  is_active?: boolean | null
}

type SongLibrarySongListProps = {
  songs: Song[]
  setLists: SetListOption[]
}

function SongSetListBulkDialog({ songs, setLists, dialogRef }: { songs: Song[]; setLists: SetListOption[]; dialogRef: RefObject<HTMLDialogElement | null> }) {
  const selectedSongIds = useMemo(() => songs.map((song) => song.id), [songs])

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(92vw,52rem)] rounded-3xl border border-white/10 bg-slate-950 p-0 text-slate-100 backdrop:bg-slate-950/70"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{bandSetListsCopy.addSelectedToSetList}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{bandSetListsCopy.selectedSongsTitle}</h2>
            <p className="mt-2 text-sm text-slate-300">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'} selected.
            </p>
          </div>
          <form method="dialog">
            <button className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 hover:border-cyan-400/50">
              Close
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
          {songs.map((song) => (
            <p key={song.id} className="py-1">{song.artist} — {song.title}</p>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <h3 className="text-lg font-semibold text-white">{bandSetListsCopy.addToExistingSetList}</h3>
            <p className="mt-1 text-sm text-slate-400">{bandSetListsCopy.appendSongsNote}</p>
            {setLists.length ? (
              <form className="mt-4 space-y-4" action="/api/band/set-lists" method="post">
                <input type="hidden" name="action" value="append" />
                {selectedSongIds.map((songId) => (
                  <input key={songId} type="hidden" name="songIds" value={songId} />
                ))}
                <label className="block space-y-2 text-sm font-medium text-slate-200">
                  <span>{bandSetListsCopy.selectSetListLabel}</span>
                  <select name="setListId" defaultValue="" required className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white">
                    <option value="" disabled>{bandSetListsCopy.setListPlaceholder}</option>
                    {setLists.map((setList) => (
                      <option key={setList.id} value={setList.id}>
                        {setList.name}{setList.is_active ? ` (${bandSetListsCopy.activeBadge.toLowerCase()})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">
                  {bandSetListsCopy.appendSongsButton}
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-slate-400">{bandSetListsCopy.noSetListsYet}</p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <h3 className="text-lg font-semibold text-white">{bandSetListsCopy.createNewSetListWithSongsTitle}</h3>
            <p className="mt-1 text-sm text-slate-400">{bandSetListsCopy.createWithSongsNote}</p>
            <form className="mt-4 grid gap-4" action="/api/band/set-lists" method="post">
              {selectedSongIds.map((songId) => (
                <input key={songId} type="hidden" name="songIds" value={songId} />
              ))}
              <div className="space-y-2">
                <label htmlFor="bulk-set-list-name" className="text-sm font-medium text-slate-200">
                  {bandSetListsCopy.nameLabel}
                </label>
                <input id="bulk-set-list-name" name="name" type="text" required className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Opening Set" />
              </div>
              <div className="space-y-2">
                <label htmlFor="bulk-set-list-description" className="text-sm font-medium text-slate-200">
                  {bandSetListsCopy.descriptionLabel}
                </label>
                <input id="bulk-set-list-description" name="description" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
              </div>
              <div className="space-y-2">
                <label htmlFor="bulk-set-list-notes" className="text-sm font-medium text-slate-200">
                  {bandSetListsCopy.notesLabel}
                </label>
                <input id="bulk-set-list-notes" name="notes" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
              </div>
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">
                {bandSetListsCopy.createWithSongsButton}
              </button>
            </form>
          </section>
        </div>
      </div>
    </dialog>
  )
}

export function SongLibrarySongList({ songs, setLists }: SongLibrarySongListProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])

  const selectedSongs = useMemo(
    () => songs.filter((song) => selectedSongIds.includes(song.id)),
    [songs, selectedSongIds]
  )
  const selectedCount = selectedSongIds.length
  const allSelected = songs.length > 0 && selectedCount === songs.length

  function toggleSong(songId: string) {
    setSelectedSongIds((current) =>
      current.includes(songId) ? current.filter((id) => id !== songId) : [...current, songId]
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => {
              setSelectedSongIds(event.target.checked ? songs.map((song) => song.id) : [])
            }}
            className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
          />
          <span>{bandSetListsCopy.selectAllSongs}</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!selectedCount}
            onClick={() => dialogRef.current?.showModal()}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bandSetListsCopy.addSelectedToSetList}
          </button>
          {selectedCount ? (
            <button
              type="button"
              onClick={() => setSelectedSongIds([])}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white"
            >
              {bandSetListsCopy.clearSelection}
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-400">
        {selectedCount ? `${selectedCount} ${selectedCount === 1 ? 'song' : 'songs'} selected.` : bandSetListsCopy.selectedSongsHint}
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <div className="divide-y divide-white/10">
          {songs.length ? songs.map((song) => (
            <div key={song.id} className={`grid gap-4 bg-slate-950/50 p-4 lg:grid-cols-[auto_1.2fr_1.2fr_0.6fr_auto] lg:items-center ${selectedSongIds.includes(song.id) ? 'bg-cyan-400/5' : ''}`}>
              <div className="flex items-start pt-1">
                <input
                  type="checkbox"
                  checked={selectedSongIds.includes(song.id)}
                  onChange={() => toggleSong(song.id)}
                  aria-label={`Select ${song.artist} — ${song.title}`}
                  className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{bandCopy.songsPage.rowArtistLabel}</p>
                <p className="mt-1 text-base font-semibold text-white">{song.artist}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{song.source_type ?? bandCopy.songsPage.sourceUploaded}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{bandCopy.songsPage.rowSongTitleLabel}</p>
                <p className="mt-1 text-base font-semibold text-white">{song.title}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{bandCopy.songsPage.rowDurationLabel}</p>
                <p className="mt-1 text-base font-semibold text-white">{typeof song.duration_ms === 'number' && song.duration_ms > 0 ? `${Math.floor(song.duration_ms / 60000)}:${String(Math.floor(song.duration_ms / 1000) % 60).padStart(2, '0')}` : '—'}</p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <AdminRowDialog triggerLabel={bandCopy.songsPage.editButton} title={`Edit ${song.title}`}>
                  <form className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5" action={`/api/band/songs/${song.id}`} method="post">
                    <input type="hidden" name="action" value="update" />
                    <div className="space-y-2"><label className="text-sm font-medium text-slate-200" htmlFor={`song-title-${song.id}`}>{bandCopy.songsPage.rowSongTitleLabel}</label><input id={`song-title-${song.id}`} name="title" defaultValue={song.title} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium text-slate-200" htmlFor={`song-artist-${song.id}`}>{bandCopy.songsPage.rowArtistLabel}</label><input id={`song-artist-${song.id}`} name="artist" defaultValue={song.artist} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium text-slate-200" htmlFor={`song-duration-${song.id}`}>{bandCopy.songsPage.rowDurationLabel}</label><input id={`song-duration-${song.id}`} name="durationMs" type="number" min={0} defaultValue={song.duration_ms ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" /></div>
                    <div className="flex justify-end"><button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{bandCopy.songsPage.saveButton}</button></div>
                  </form>
                </AdminRowDialog>
                <form action={`/api/band/songs/${song.id}`} method="post"><input type="hidden" name="action" value="archive" /><button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">{bandCopy.songsPage.archiveButton}</button></form>
              </div>
            </div>
          )) : <div className="bg-slate-950/50 p-6 text-slate-400">{bandCopy.songsPage.noSongs}</div>}
        </div>
      </div>

      <SongSetListBulkDialog songs={selectedSongs} setLists={setLists} dialogRef={dialogRef} />
    </>
  )
}
