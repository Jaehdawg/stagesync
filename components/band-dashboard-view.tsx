import type { ReactNode } from 'react'
import { buildQrCodeImageUrl } from '../lib/public-links'
import { QueueActionButtons } from './queue-action-buttons'
import { bandDashboardViewCopy } from '@/content/en/components/band-dashboard-view'

export type BandDashboardState = {
  brand: {
    label: string
    title: string
    description: string
  }
  analytics: { label: string; value: string }[]
  queueItems: { id?: string | null; position: number; name: string; song: string; status: string }[]
  bandLinks: { label: string; href: string }[]
  paymentLinks: { label: string; href: string }[]
  customMessage: string
  currentShowId?: string | null
  currentShowName?: string | null
  showState: 'active' | 'paused' | 'ended'
  signupStatusMessage: string
  signupEnabled?: boolean
  showDurationMinutes?: number | null
  signupBufferMinutes?: number | null
  songSourceMode?: 'uploaded' | 'tidal_playlist'
  bandAccessLevel?: 'admin' | 'member'
  testMode?: boolean
  singerSignupUrl?: string | null
}

function Panel({
  title,
  children,
  eyebrow,
}: Readonly<{
  title: string
  eyebrow?: string
  children: ReactNode
}>) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/20">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-4 text-sm leading-6 text-slate-300">{children}</div>
    </section>
  )
}

export function BandDashboardView({
  brand,
  analytics,
  queueItems,
  bandLinks,
  paymentLinks,
  customMessage,
  currentShowId,
  currentShowName,
  showState,
  signupStatusMessage,
  showDurationMinutes,
  signupBufferMinutes,
  songSourceMode = 'uploaded',
  bandAccessLevel = 'admin',
  testMode = false,
  singerSignupUrl = null,
}: BandDashboardState) {
  const canManageShow = bandAccessLevel !== 'member'
  const liveQueueItems = queueItems.filter((item) => !['played', 'cancelled'].includes(item.status))
  const historyItems = queueItems.filter((item) => ['played', 'cancelled'].includes(item.status))
  const controls =
    showState === 'active'
      ? [
          { label: bandDashboardViewCopy.operations.pauseSignups, value: 'pause' },
          { label: bandDashboardViewCopy.operations.endShow, value: 'end' },
        ]
      : showState === 'paused'
        ? [
            { label: bandDashboardViewCopy.operations.resumeSignups, value: 'resume' },
            { label: bandDashboardViewCopy.operations.endShow, value: 'end' },
          ]
        : [{ label: bandDashboardViewCopy.operations.startShow, value: 'start' }]

  return (
    <main className="space-y-8">
      <header className="rounded-3xl border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              {brand.label}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {brand.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {brand.description}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {analytics.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className={canManageShow ? 'grid gap-8 xl:grid-cols-[1.15fr_0.85fr]' : 'grid gap-8'}>
        <div className="grid gap-8">
          {canManageShow ? (
          <Panel title={bandDashboardViewCopy.operations.showControls} eyebrow={bandDashboardViewCopy.operations.operationsEyebrow}>
            {!currentShowId ? (
              <form className="space-y-4" action={testMode ? '/api/testing/show' : '/api/shows'} method="post">
                <input type="hidden" name="action" value="create" />
                <div className="space-y-2">
                  <label htmlFor="show-name" className="text-sm font-medium text-slate-200">
                    {bandDashboardViewCopy.operations.showNameLabel}
                  </label>
                  <input
                    id="show-name"
                    name="name"
                    type="text"
                    defaultValue={currentShowName ?? 'StageSync Live'}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="show-description" className="text-sm font-medium text-slate-200">
                    {bandDashboardViewCopy.operations.descriptionLabel}
                  </label>
                  <input
                    id="show-description"
                    name="description"
                    type="text"
                    defaultValue="Live karaoke show"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white"
>
                  {bandDashboardViewCopy.operations.startShow}
                </button>
              </form>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  {controls.map((control) => (
                    <form
                      key={control.value}
                      action={testMode ? '/api/testing/show' : `/api/shows/${currentShowId ?? ''}/state`}
                      method="post"
                    >
                      <input type="hidden" name="action" value={control.value} />
                      <input type="hidden" name="eventId" value={currentShowId ?? ''} />
                      <button
                        type="submit"
                        disabled={!currentShowId}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {control.label}
                      </button>
                    </form>
                  ))}
                </div>
                {currentShowId ? (
                  <form
                    className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                    action={testMode ? '/api/testing/show' : '/api/shows'}
                    method="post"
                  >
                    <input type="hidden" name="action" value="settings" />
                    <input type="hidden" name="eventId" value={currentShowId} />
                    <h3 className="text-lg font-semibold text-white">{bandDashboardViewCopy.operations.showSettings}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <label htmlFor="show-name" className="text-sm font-medium text-slate-200">
                          {bandDashboardViewCopy.operations.showNameLabel}
                        </label>
                        <input
                          id="show-name"
                          name="name"
                          type="text"
                          defaultValue={currentShowName ?? 'StageSync Live'}
                          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label htmlFor="show-description" className="text-sm font-medium text-slate-200">
                          {bandDashboardViewCopy.operations.descriptionLabel}
                        </label>
                        <input
                          id="show-description"
                          name="description"
                          type="text"
                          defaultValue="Live karaoke show"
                          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="show-duration" className="text-sm font-medium text-slate-200">
{bandDashboardViewCopy.operations.showDurationLabel}
                        </label>
                        <input
                          id="show-duration"
                          name="showDurationMinutes"
                          type="number"
                          min={0}
                          defaultValue={showDurationMinutes ?? 60}
                          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="signup-buffer" className="text-sm font-medium text-slate-200">
{bandDashboardViewCopy.operations.bufferLabel}
                        </label>
                        <input
                          id="signup-buffer"
                          name="signupBufferMinutes"
                          type="number"
                          min={0}
                          defaultValue={signupBufferMinutes ?? 1}
                          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label htmlFor="song-source-mode" className="text-sm font-medium text-slate-200">
{bandDashboardViewCopy.operations.songSourceLabel}
                        </label>
                        <select
                          id="song-source-mode"
                          name="songSourceMode"
                          defaultValue={songSourceMode}
                          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="uploaded">{bandDashboardViewCopy.operations.uploadedSongList}</option>
                          <option value="tidal_playlist">{bandDashboardViewCopy.operations.tidalPlaylist}</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white"
                    >
                      {bandDashboardViewCopy.operations.saveSettings}
                    </button>
                  </form>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href="/band/songs" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
                    {bandDashboardViewCopy.operations.openSongLibrary}
                  </a>
                </div>
                <p className="mt-4 text-slate-400">{signupStatusMessage}</p>
              </>
            )}
          </Panel>
          ) : null}

          <Panel title={bandDashboardViewCopy.queue.title} eyebrow={bandDashboardViewCopy.queue.eyebrow}>
            {liveQueueItems.length ? (
              <div className="space-y-3">
                {liveQueueItems.map((item) => (
                  <div key={item.id ?? `${item.position}-${item.name}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{bandDashboardViewCopy.queue.positionPrefix} {item.position}</p>
                        <h3 className="mt-1 text-base font-semibold text-white">{item.song}</h3>
                        <p className="text-sm text-slate-400">{item.name}</p>
                      </div>
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-200">
                      <QueueActionButtons queueItemId={item.id} action="played" label={bandDashboardViewCopy.queue.played} />
                      <QueueActionButtons queueItemId={item.id} action="remove" label={bandDashboardViewCopy.queue.remove} />
                      <QueueActionButtons queueItemId={item.id} action="up" label={bandDashboardViewCopy.queue.moveUp} />
                      <QueueActionButtons queueItemId={item.id} action="down" label={bandDashboardViewCopy.queue.moveDown} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-slate-400">
                {bandDashboardViewCopy.queue.empty}
              </p>
            )}

            <details className="mt-5 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-white">
                {bandDashboardViewCopy.queue.historyTitle}
                <span className="ml-2 text-xs font-normal text-slate-400">{bandDashboardViewCopy.queue.historySubtitle}</span>
              </summary>
              <div className="mt-4 space-y-3">
                {historyItems.length ? (
                  historyItems.map((item) => (
                    <div key={item.id ?? `${item.position}-${item.name}-history`} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{item.status}</p>
                          <p className="mt-1 text-lg font-semibold text-white">
                            {item.song}
                          </p>
                          <p className="text-sm text-slate-400">{item.name}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">{bandDashboardViewCopy.queue.historyEmpty}</p>
                )}
              </div>
            </details>
          </Panel>
        </div>

        {canManageShow ? (
        <div className="grid gap-8">
          <Panel title={bandDashboardViewCopy.signupLink.title} eyebrow={bandDashboardViewCopy.signupLink.eyebrow}>
            {singerSignupUrl ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{bandDashboardViewCopy.signupLink.publicUrl}</p>
                  <a
                    href={singerSignupUrl}
                    className="mt-2 block break-all text-sm text-cyan-200 underline decoration-cyan-400/40 underline-offset-4"
                  >
                    {singerSignupUrl}
                  </a>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <img
                    src={buildQrCodeImageUrl(singerSignupUrl)}
                    alt={bandDashboardViewCopy.signupLink.qrAlt}
                    className="h-24 w-24 rounded-xl border border-white/10 bg-white p-2"
                  />
                  <p className="text-sm text-slate-300">
                    {bandDashboardViewCopy.signupLink.qrPrompt}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">{bandDashboardViewCopy.signupLink.empty}</p>
            )}
          </Panel>

        </div>
        ) : null}
      </div>
    </main>
  )
}
