'use client'

import { useRef } from 'react'

import { bandSetListsCopy } from '@/content/en/components/band-set-lists'

type SetListOption = {
  id: string
  name: string
  is_active?: boolean | null
}

type SongSetListDialogProps = {
  songId: string
  songTitle: string
  songArtist: string
  setLists: SetListOption[]
}

export function SongSetListDialog({ songId, songTitle, songArtist, setLists }: SongSetListDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50"
      >
        {bandSetListsCopy.addToSetList}
      </button>

      <dialog
        ref={dialogRef}
        className="w-[min(92vw,52rem)] rounded-3xl border border-white/10 bg-slate-950 p-0 text-slate-100 backdrop:bg-slate-950/70"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{bandSetListsCopy.addToSetList}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{bandSetListsCopy.addToSetListTitle}</h2>
              <p className="mt-2 text-sm text-slate-300">{songArtist} — {songTitle}</p>
            </div>
            <form method="dialog">
              <button className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 hover:border-cyan-400/50">
                Close
              </button>
            </form>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <h3 className="text-lg font-semibold text-white">{bandSetListsCopy.addToExistingSetList}</h3>
              <p className="mt-1 text-sm text-slate-400">{bandSetListsCopy.appendSongNote}</p>
              {setLists.length ? (
                <form className="mt-4 space-y-4" action="/api/band/set-lists" method="post">
                  <input type="hidden" name="action" value="append" />
                  <input type="hidden" name="songId" value={songId} />
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
                    {bandSetListsCopy.appendSongButton}
                  </button>
                </form>
              ) : (
                <p className="mt-4 text-sm text-slate-400">{bandSetListsCopy.noSetListsYet}</p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <h3 className="text-lg font-semibold text-white">{bandSetListsCopy.createNewSetListTitle}</h3>
              <p className="mt-1 text-sm text-slate-400">{bandSetListsCopy.createWithSongNote}</p>
              <form className="mt-4 grid gap-4" action="/api/band/set-lists" method="post">
                <input type="hidden" name="songIds" value={songId} />
                <div className="space-y-2">
                  <label htmlFor={`set-list-name-${songId}`} className="text-sm font-medium text-slate-200">
                    {bandSetListsCopy.nameLabel}
                  </label>
                  <input id={`set-list-name-${songId}`} name="name" type="text" required className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" placeholder="Opening Set" />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`set-list-description-${songId}`} className="text-sm font-medium text-slate-200">
                    {bandSetListsCopy.descriptionLabel}
                  </label>
                  <input id={`set-list-description-${songId}`} name="description" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                </div>
                <div className="space-y-2">
                  <label htmlFor={`set-list-notes-${songId}`} className="text-sm font-medium text-slate-200">
                    {bandSetListsCopy.notesLabel}
                  </label>
                  <input id={`set-list-notes-${songId}`} name="notes" type="text" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
                </div>
                <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">
                  {bandSetListsCopy.createWithSongButton}
                </button>
              </form>
            </section>
          </div>
        </div>
      </dialog>
    </>
  )
}
