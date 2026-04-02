import type { ReactNode } from 'react'
import { SingerRegistrationForm } from './singer-registration-form'
import { TidalSearchPanel } from './tidal-search-panel'
import { SingerCurrentRequestCard } from './singer-current-request-card'
import { SongLyricsPanel } from './song-lyrics-panel'

type QueueEntry = {
  id: string
  position: number
  artist: string
  title: string
  singerName?: string | null
  status: string
}

type DashboardState = {
  bandName: string
  customMessage?: string | null
  signupEnabled: boolean
  signupStatusMessage: string
  songSourceMode?: 'uploaded' | 'tidal_playlist' | 'tidal_catalog'
  tidalPlaylistUrl?: string | null
  singerName?: string | null
  bandId: string
  showId: string
  currentRequest?: { artist: string; title: string } | null
  liveQueueItems?: QueueEntry[]
  historyItems?: QueueEntry[]
  lyricsTrack?: { artist: string; title: string } | null
  currentShowName?: string | null
  showState?: 'active' | 'paused' | 'ended'
}

function Panel({ title, children, eyebrow }: { title: string; children: ReactNode; eyebrow?: string }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/10">
      <div className="mb-5">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function SingerDashboardView(state: DashboardState) {
  const songSourceMode = state.songSourceMode === 'tidal_playlist' ? 'tidal_playlist' : 'uploaded'
  const liveQueueItems = state.liveQueueItems ?? []
  const historyItems = state.historyItems ?? []
  const lyricsTrack = state.lyricsTrack ?? state.currentRequest ?? liveQueueItems[0] ?? null
  const canPickSong = state.signupEnabled || Boolean(state.currentRequest)

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto mb-6 max-w-7xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/15 via-slate-900 to-fuchsia-500/10 p-8 shadow-2xl shadow-cyan-950/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">StageSync Singer Page</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{state.bandName}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
          {state.customMessage ?? 'Pick a song, sing your heart out, and keep the queue moving.'}
        </p>
        {state.currentShowName ? <p className="mt-4 text-sm text-cyan-100">Show: {state.currentShowName}</p> : null}
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Panel title="Singer Sign-up" eyebrow="StageSync">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                {state.singerName ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-lg font-semibold text-white">Singer details</h3>
                    <p className="mt-3 text-2xl font-semibold text-white">{state.singerName}</p>
                  </div>
                ) : (
                  <SingerRegistrationForm
                    disabled={!state.signupEnabled}
                    statusMessage={state.signupStatusMessage}
                  />
                )}

                {state.currentRequest ? (
                  <SingerCurrentRequestCard
                    bandId={state.bandId}
                    showId={state.showId}
                    artist={state.currentRequest.artist}
                    title={state.currentRequest.title}
                  />
                ) : null}
              </div>

              <div className="space-y-4">
                <TidalSearchPanel
                  disabled={!canPickSong}
                  statusMessage={state.signupStatusMessage}
                  sourceMode={songSourceMode}
                  playlistUrl={state.tidalPlaylistUrl ?? null}
                  bandId={state.bandId}
                  showId={state.showId}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Live Queue" eyebrow="StageSync">
            {liveQueueItems.length ? (
              <div className="space-y-3">
                {liveQueueItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">#{item.position}</p>
                        <p className="mt-1 text-lg font-semibold text-white">{item.artist} — {item.title}</p>
                      </div>
                      {item.singerName ? <p className="text-sm text-slate-400">{item.singerName}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No songs in the live queue yet.</p>
            )}
          </Panel>

          <Panel title="History" eyebrow="StageSync">
            {historyItems.length ? (
              <div className="space-y-3">
                {historyItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{item.status}</p>
                        <p className="mt-1 text-lg font-semibold text-white">{item.artist} — {item.title}</p>
                      </div>
                      {item.singerName ? <p className="text-sm text-slate-500">{item.singerName}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">Played and cancelled songs will appear here.</p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <SongLyricsPanel
            artist={lyricsTrack?.artist ?? null}
            title={lyricsTrack?.title ?? null}
          />

          <Panel title="Show Status" eyebrow="StageSync">
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                <span className="text-slate-400">Show state:</span> {state.showState ?? 'ended'}
              </p>
              <p>
                <span className="text-slate-400">Singer Slots:</span> {state.signupStatusMessage}
              </p>
              {state.currentRequest ? (
                <p>
                  <span className="text-slate-400">Your request:</span> {state.currentRequest.artist} — {state.currentRequest.title}
                </p>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  )
}
