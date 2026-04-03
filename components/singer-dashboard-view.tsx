'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { SingerRegistrationForm } from './singer-registration-form'
import { TidalSearchPanel } from './tidal-search-panel'
import { SingerCurrentRequestCard } from './singer-current-request-card'
import { SongLyricsPanel } from './song-lyrics-panel'
import { AutoRefresh } from './auto-refresh'

type QueueEntry = {
  id: string
  position: number
  artist: string
  title: string
  singerName?: string | null
  status: string
}

type Track = {
  artist: string
  title: string
}

type BandProfile = {
  bandName: string
  websiteUrl?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  tiktokUrl?: string | null
  paypalUrl?: string | null
  venmoUrl?: string | null
  cashappUrl?: string | null
  customMessage?: string | null
}

type DashboardState = {
  bandProfile?: BandProfile
  brand?: { label: string; title: string; description: string }
  bandLinks?: { label: string; href: string }[]
  paymentLinks?: { label: string; href: string }[]
  customMessage?: string
  signupEnabled: boolean
  signupStatusMessage: string
  songSourceMode?: 'uploaded' | 'tidal_playlist'
  tidalPlaylistUrl?: string | null
  singerName?: string | null
  bandId?: string | null
  showId?: string | null
  currentRequest?: Track | null
  liveQueueItems?: QueueEntry[]
  historyItems?: QueueEntry[]
  lyricsTrack?: Track | null
  currentShowName?: string | null
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/10">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function LinkList({ label, links }: { label: string; links: Array<{ href?: string | null; text: string }> }) {
  const active = links.filter((link) => Boolean(link.href))
  if (!active.length) return null
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {active.map((link) => (
          <a
            key={`${label}-${link.text}`}
            href={link.href!}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
          >
            {link.text}
          </a>
        ))}
      </div>
    </div>
  )
}

export function SingerDashboardView(state: DashboardState) {
  const [currentRequest, setCurrentRequest] = useState<Track | null>(state.currentRequest ?? null)
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')
  const [liveQueueItems, setLiveQueueItems] = useState<QueueEntry[]>(state.liveQueueItems ?? [])
  const [historyItems, setHistoryItems] = useState<QueueEntry[]>(state.historyItems ?? [])
  const [lyricsTrack, setLyricsTrack] = useState<Track | null>(state.lyricsTrack ?? null)

  useEffect(() => {
    if (state.currentRequest) {
      setCurrentRequest(state.currentRequest)
      if (state.lyricsTrack) {
        setLyricsTrack(state.lyricsTrack)
      }
    } else if (currentRequest) {
      const serverHasFinishedRequest = state.historyItems?.some(
        (item) => item.artist === currentRequest.artist && item.title === currentRequest.title
      )
      if (serverHasFinishedRequest) {
        setCurrentRequest(null)
        setLyricsTrack(null)
      }
    }

    const serverHasPendingQueue = Boolean(state.liveQueueItems?.length)
    const shouldSyncLiveQueue = serverHasPendingQueue || (currentRequest ? state.historyItems?.some((item) => item.artist === currentRequest.artist && item.title === currentRequest.title) : false)
    if (shouldSyncLiveQueue) {
      setLiveQueueItems(state.liveQueueItems ?? [])
    }

    if (state.historyItems?.length) {
      setHistoryItems(state.historyItems)
    }
  }, [state.currentRequest, state.liveQueueItems, state.historyItems, state.lyricsTrack, currentRequest])

  const bandProfile = state.bandProfile ?? {
    bandName: state.brand?.title ?? 'StageSync',
    websiteUrl: state.bandLinks?.find((link) => link.label === 'Website')?.href ?? null,
    facebookUrl: state.bandLinks?.find((link) => link.label === 'Facebook')?.href ?? null,
    instagramUrl: state.bandLinks?.find((link) => link.label === 'Instagram')?.href ?? null,
    tiktokUrl: state.bandLinks?.find((link) => link.label === 'TikTok')?.href ?? null,
    paypalUrl: state.paymentLinks?.find((link) => link.label === 'PayPal')?.href ?? null,
    venmoUrl: state.paymentLinks?.find((link) => link.label === 'Venmo')?.href ?? null,
    cashappUrl: state.paymentLinks?.find((link) => link.label === 'CashApp')?.href ?? null,
    customMessage: state.customMessage ?? null,
  }
  const songSourceMode = state.songSourceMode === 'tidal_playlist' ? 'tidal_playlist' : 'uploaded'
  const currentTrack = liveQueueItems[0] ?? currentRequest ?? lyricsTrack ?? null

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto mb-6 max-w-7xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/15 via-slate-900 to-fuchsia-500/10 p-8 shadow-2xl shadow-cyan-950/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">StageSync Singer Page</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{bandProfile.bandName}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
          {bandProfile.customMessage ?? 'Pick a song, sing your heart out, and keep the queue moving.'}
        </p>
        {state.currentShowName ? <p className="mt-4 text-sm text-cyan-100">Show: {state.currentShowName}</p> : null}
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/10">
            <div className="space-y-4 text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Band profile</p>
                <p className="mt-2 text-xl font-semibold text-white">{bandProfile.bandName}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {bandProfile.customMessage ?? 'Band links and tip links will appear here when the band profile is filled out.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[11rem] flex-1"><LinkList label="Website" links={[{ href: bandProfile.websiteUrl ?? null, text: 'Website' }]} /></div>
                <div className="min-w-[11rem] flex-1">
                  <LinkList
                    label="Social"
                    links={[
                      { href: bandProfile.facebookUrl ?? null, text: 'Facebook' },
                      { href: bandProfile.instagramUrl ?? null, text: 'Instagram' },
                      { href: bandProfile.tiktokUrl ?? null, text: 'TikTok' },
                    ]}
                  />
                </div>
                <div className="min-w-[11rem] flex-1">
                  <LinkList
                    label="Tips"
                    links={[
                      { href: bandProfile.paypalUrl ?? null, text: 'PayPal' },
                      { href: bandProfile.venmoUrl ?? null, text: 'Venmo' },
                      { href: bandProfile.cashappUrl ?? null, text: 'Cash App' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Now Playing</p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {currentTrack ? `${currentTrack.artist} — ${currentTrack.title}` : 'Pick a song to load lyrics.'}
            </p>
          </div>

          <Panel title="Singer Sign-up">
            <div className="space-y-4">
              {!state.singerName ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={authMode === 'signup' ? 'rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950' : 'rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white'}
                  >
                    Sign-up
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={authMode === 'login' ? 'rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950' : 'rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white'}
                  >
                    Login
                  </button>
                </div>
              ) : null}

              {state.singerName ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold text-white">Singer details</h3>
                  <p className="mt-3 text-2xl font-semibold text-white">{state.singerName}</p>
                </div>
              ) : authMode === 'signup' ? (
                <SingerRegistrationForm mode="signup" disabled={!state.signupEnabled} statusMessage={state.signupStatusMessage} />
              ) : (
                <SingerRegistrationForm mode="login" />
              )}

              {currentRequest ? (
                <SingerCurrentRequestCard
                  bandId={state.bandId ?? ''}
                  showId={state.showId ?? ''}
                  artist={currentRequest.artist}
                  title={currentRequest.title}
                  onCancelled={() => {
                    setCurrentRequest(null)
                    setLyricsTrack(null)
                    setLiveQueueItems((items) => items.filter((item) => item.artist !== currentRequest.artist || item.title !== currentRequest.title))
                    setHistoryItems((items) => [
                      {
                        id: `cancelled-${Date.now()}`,
                        position: 0,
                        artist: currentRequest.artist,
                        title: currentRequest.title,
                        singerName: state.singerName ?? null,
                        status: 'cancelled',
                      },
                      ...items,
                    ])
                  }}
                />
              ) : authMode === 'signup' ? (
                <TidalSearchPanel
                  disabled={!state.signupEnabled}
                  statusMessage={state.signupStatusMessage}
                  sourceMode={songSourceMode}
                  playlistUrl={state.tidalPlaylistUrl ?? null}
                  bandId={state.bandId ?? ''}
                  showId={state.showId ?? ''}
                  onQueued={(track) => {
                    const queued = { artist: track.artist, title: track.title }
                    setCurrentRequest(queued)
                    setLyricsTrack(queued)
                    setLiveQueueItems((items) => [
                      ...items,
                      {
                        id: `queued-${Date.now()}`,
                        position: items.length + 1,
                        artist: track.artist,
                        title: track.title,
                        singerName: state.singerName ?? null,
                        status: 'queued',
                      },
                    ])
                  }}
                />
              ) : null}
            </div>
          </Panel>

          <Panel title="Live Queue">
            {liveQueueItems.length ? (
              <div className="space-y-3">
                {liveQueueItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">#{item.position}</p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {item.artist} — {item.title}
                        </p>
                      </div>
                      {item.singerName ? <p className="text-sm text-slate-400">{item.singerName}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No songs in the live queue yet.</p>
            )}

            <details className="mt-5 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-white">
                History
                <span className="ml-2 text-xs font-normal text-slate-400">(played and cancelled songs)</span>
              </summary>
              <div className="mt-4 space-y-3">
                {historyItems.length ? (
                  historyItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{item.status}</p>
                          <p className="mt-1 text-lg font-semibold text-white">
                            {item.artist} — {item.title}
                          </p>
                        </div>
                        {item.singerName ? <p className="text-sm text-slate-500">{item.singerName}</p> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Played and cancelled songs will appear here.</p>
                )}
              </div>
            </details>
          </Panel>
        </div>

        <div className="space-y-6">
          <SongLyricsPanel artist={currentTrack?.artist ?? null} title={currentTrack?.title ?? null} openByDefault={Boolean(currentTrack)} />
        </div>
      </div>

      <AutoRefresh enabled intervalMs={5000} />
    </main>
  )
}
