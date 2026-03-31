export type BandDashboardState = {
  brand: {
    label: string
    title: string
    description: string
  }
  analytics: { label: string; value: string }[]
  queueItems: { position: number; name: string; song: string; status: string }[]
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
  testMode?: boolean
}

function Panel({
  title,
  children,
  eyebrow,
}: Readonly<{
  title: string
  eyebrow?: string
  children: React.ReactNode
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
  testMode = false,
}: BandDashboardState) {
  const controls =
    showState === 'active'
      ? [
          { label: 'Pause signups', value: 'pause' },
          { label: 'End show', value: 'end' },
        ]
      : showState === 'paused'
        ? [
            { label: 'Resume signups', value: 'resume' },
            { label: 'End show', value: 'end' },
          ]
        : [{ label: 'Start show', value: 'start' }]

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

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-8">
          <Panel title="Show controls" eyebrow="Operations">
            {!currentShowId && testMode ? (
              <form className="space-y-4" action="/api/testing/show" method="post">
                <input type="hidden" name="action" value="create" />
                <div className="space-y-2">
                  <label htmlFor="show-name" className="text-sm font-medium text-slate-200">
                    Show name
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
                    Description
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
                  Create show
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
                {testMode && currentShowId ? (
                  <form className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4" action="/api/testing/show" method="post">
                    <input type="hidden" name="action" value="settings" />
                    <input type="hidden" name="eventId" value={currentShowId} />
                    <h3 className="text-lg font-semibold text-white">Show settings</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="show-duration" className="text-sm font-medium text-slate-200">
                          Show duration (minutes)
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
                          Buffer between songs (minutes)
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
                    </div>
                    <button
                      type="submit"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white"
                    >
                      Save settings
                    </button>
                  </form>
                ) : null}
                <p className="mt-4 text-slate-400">{signupStatusMessage}</p>
              </>
            )}
          </Panel>

          <Panel title="Queue management" eyebrow="Queue admin">
            <div className="space-y-3">
              {queueItems.map((item) => (
                <div key={`${item.position}-${item.name}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Position {item.position}</p>
                      <h3 className="mt-1 text-base font-semibold text-white">{item.song}</h3>
                      <p className="text-sm text-slate-400">{item.name}</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-200">
                    <span className="rounded-full border border-white/10 px-3 py-1">Played</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">Remove</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">Move up</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">Move down</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-8">
          <Panel title="Band profile" eyebrow="Public info">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {bandLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-center text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </Panel>

          <Panel title="Payment links" eyebrow="Tips">
            <ul className="space-y-2 text-slate-300">
              {paymentLinks.map((link) => (
                <li key={link.label}>
                  {link.label} — {link.href}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-400">{customMessage}</p>
          </Panel>
        </div>
      </div>
    </main>
  )
}
