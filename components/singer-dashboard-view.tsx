import type { ReactNode } from 'react'
import { SingerRegistrationForm } from './singer-registration-form'
import { SongRequestForm } from './song-request-form'
import { TidalSearchPanel } from './tidal-search-panel'

type DashboardState = {
  brand: {
    label: string
    title: string
    description: string
  }
  analytics: { label: string; value: string }[]
  singerActions: string[]
  queueItems: { position: number; name: string; song: string; status: string }[]
  bandLinks: { label: string; href: string }[]
  paymentLinks: { label: string; href: string }[]
  customMessage: string
  signupEnabled: boolean
  signupStatusMessage: string
  songSourceMode?: 'uploaded' | 'tidal_playlist' | 'tidal_catalog'
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
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-4 text-sm leading-6 text-slate-300">{children}</div>
    </section>
  )
}

export function SingerDashboardView(state: DashboardState) {
  const songSourceMode = state.songSourceMode ?? 'tidal_catalog'
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                {state.brand.label}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {state.brand.title}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                {state.brand.description}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {state.analytics.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="grid gap-8">
            <Panel title="Singer experience" eyebrow="Public flow">
              <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <SingerRegistrationForm
                  disabled={!state.signupEnabled}
                  statusMessage={state.signupStatusMessage}
                />

                <div className="space-y-4">
                  <TidalSearchPanel
                    disabled={!state.signupEnabled}
                    statusMessage={state.signupStatusMessage}
                    sourceMode={songSourceMode}
                  />
                  <SongRequestForm
                    disabled={!state.signupEnabled}
                    statusMessage={state.signupStatusMessage}
                  />
                </div>
              </div>
            </Panel>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Live queue" eyebrow="Realtime tracking">
                {state.queueItems.length ? (
                  <div className="space-y-3">
                    {state.queueItems.map((item) => (
                      <div key={`${item.position}-${item.name}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                              Position {item.position}
                            </p>
                            <h3 className="mt-1 text-base font-semibold text-white">{item.song}</h3>
                            <p className="text-sm text-slate-400">{item.name}</p>
                          </div>
                          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-slate-400">
                    No songs are in the queue yet. New requests will appear here once singers add them.
                  </p>
                )}
              </Panel>

              <Panel title="Lyrics" eyebrow="Current song">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Now singing</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Dreams</h3>
                  <p className="text-sm text-slate-400">Fleetwood Mac</p>
                  <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">
{`Now here you go again,
you say you want your freedom.
Well, who am I to keep you down?`}
                  </pre>
                </div>
              </Panel>
            </div>
          </div>

          <div className="grid gap-8">
            <Panel title="Band profile" eyebrow="Public info">
              <div className="space-y-4">
                <p className="text-slate-300">Website, socials, and payment links for the current show band.</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {state.bandLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-center text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Payment links" eyebrow="Tips">
              <ul className="space-y-2 text-slate-300">
                {state.paymentLinks.map((link) => (
                  <li key={link.label}>
                    {link.label} — {link.href}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-slate-400">{state.customMessage}</p>
            </Panel>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          <h2 className="text-2xl font-semibold text-white">Singer actions</h2>
          <ul className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {state.singerActions.map((action) => (
              <li key={action} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                {action}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
