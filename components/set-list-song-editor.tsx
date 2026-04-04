'use client'

import { useMemo, useRef, useState } from 'react'

import { bandSetListsCopy } from '@/content/en/components/band-set-lists'
import { UltimateGuitarSongLink } from '@/components/ultimate-guitar-song-link'

type Song = {
  id: string
  artist: string
  title: string
}

type SetListSongEditorProps = {
  setListId: string
  songs: Song[]
}

export function SetListSongEditor({ setListId, songs }: SetListSongEditorProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [orderedSongs, setOrderedSongs] = useState(songs)
  const [draggedSongId, setDraggedSongId] = useState<string | null>(null)

  const songIds = useMemo(() => orderedSongs.map((song) => song.id).join(','), [orderedSongs])

  function submitReorder(nextSongs: Song[]) {
    setOrderedSongs(nextSongs)
    queueMicrotask(() => formRef.current?.requestSubmit())
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <form ref={formRef} action={`/api/band/set-lists/${setListId}`} method="post" className="hidden">
        <input type="hidden" name="action" value="reorder" />
        <input type="hidden" name="songIds" value={songIds} readOnly />
      </form>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Songs</p>
        <p className="text-xs text-slate-400">Drag songs to reorder them</p>
      </div>

      <ol className="mt-3 space-y-2">
        {orderedSongs.length ? orderedSongs.map((song, index) => (
          <li
            key={song.id}
            draggable
            onDragStart={() => setDraggedSongId(song.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!draggedSongId || draggedSongId === song.id) return
              const fromIndex = orderedSongs.findIndex((item) => item.id === draggedSongId)
              const toIndex = orderedSongs.findIndex((item) => item.id === song.id)
              if (fromIndex < 0 || toIndex < 0) return
              const nextSongs = [...orderedSongs]
              const [moved] = nextSongs.splice(fromIndex, 1)
              nextSongs.splice(toIndex, 0, moved)
              setDraggedSongId(null)
              submitReorder(nextSongs)
            }}
            onDragEnd={() => setDraggedSongId(null)}
            className={`rounded-xl border px-3 py-2 text-sm ${draggedSongId === song.id ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-slate-950/40 text-slate-200'}`}
          >
            <UltimateGuitarSongLink artist={song.artist} title={song.title} className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="mr-2 text-xs uppercase tracking-[0.2em] text-slate-500">{index + 1}</span>
                  <span className="font-medium text-white">{song.artist} — {song.title}</span>
                </div>
                <div className="flex flex-wrap gap-2" onClickCapture={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      if (index === 0) return
                      const nextSongs = [...orderedSongs]
                      const [moved] = nextSongs.splice(index, 1)
                      nextSongs.splice(index - 1, 0, moved)
                      submitReorder(nextSongs)
                    }}
                    disabled={index === 0}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {bandSetListsCopy.moveUp}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (index === orderedSongs.length - 1) return
                      const nextSongs = [...orderedSongs]
                      const [moved] = nextSongs.splice(index, 1)
                      nextSongs.splice(index + 1, 0, moved)
                      submitReorder(nextSongs)
                    }}
                    disabled={index === orderedSongs.length - 1}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {bandSetListsCopy.moveDown}
                  </button>
                </div>
              </div>
            </UltimateGuitarSongLink>
          </li>
        )) : <li className="text-sm text-slate-400">No songs in this set list yet.</li>}
      </ol>
    </div>
  )
}
