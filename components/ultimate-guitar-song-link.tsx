'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

type UltimateGuitarSongLinkProps = {
  artist: string
  title: string
  children: ReactNode
  className?: string
}

function buildUltimateGuitarUrl(artist: string, title: string) {
  const query = `${artist} ${title}`.trim().replace(/\s+/g, ' ')
  return `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(query)}`
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isMobile
}

export function UltimateGuitarSongLink({ artist, title, children, className }: UltimateGuitarSongLinkProps) {
  const [open, setOpen] = useState(false)
  const url = useMemo(() => buildUltimateGuitarUrl(artist, title), [artist, title])
  const isMobile = useIsMobile()

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (isMobile) {
            window.open(url, '_blank', 'noopener,noreferrer')
            return
          }
          setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (isMobile) {
              window.open(url, '_blank', 'noopener,noreferrer')
              return
            }
            setOpen(true)
          }
        }}
        className={className}
      >
        {children}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6">
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Ultimate Guitar</p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {artist} — {title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:border-cyan-400/50"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:border-cyan-400/50"
                >
                  Close
                </button>
              </div>
            </div>
            <iframe
              title={`${artist} ${title} on Ultimate Guitar`}
              src={url}
              className="h-full w-full bg-white"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
