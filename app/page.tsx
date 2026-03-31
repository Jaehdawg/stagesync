import type { ReactNode } from 'react'

const singerActions = [
  'Quick registration with first, last, and email',
  'Tidal search with playlist/full catalog toggle',
  'Live queue position tracking',
  'Lyrics view',
  'Tip links and custom band message',
] as const

const queueItems = [
  { position: 1, name: 'Maya Chen', song: 'Dreams - Fleetwood Mac', status: 'Singing now' },
  { position: 2, name: 'Jordan Lee', song: 'Mr. Brightside - The Killers', status: 'Up next' },
  { position: 3, name: 'Sam Rivera', song: 'Shallow - Lady Gaga & Bradley Cooper', status: 'Waiting' },
] as const

const bandLinks = [
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'TikTok', href: 'https://tiktok.com' },
  { label: 'Website', href: 'https://example.com' },
] as const

const analytics = [
  { label: 'Active shows', value: '12' },
  { label: 'Songs in queue', value: '38' },
  { label: 'Queued singers', value: '24' },
] as const

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

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Phase 1 build
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                StageSync
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Live karaoke queueing for singers, bands, and admins — built to handle
                fast registration, Tidal search, queue control, lyrics, tips, and
                band profile visibility from one dashboard.
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

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="grid gap-8">
            <Panel title="Singer experience" eyebrow="Public flow">
              <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <form className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold text-white">Quick registration</h3>
                  <p className="mt-1 text-slate-400">
                    Capture first name, last name, and email before the singer joins the queue.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-1">
                      <label htmlFor="first-name" className="text-sm font-medium text-slate-200">
                        First name
                      </label>
                      <input
                        id="first-name"
                        name="first-name"
                        type="text"
                        placeholder="Maya"
                        className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
                      <label htmlFor="last-name" className="text-sm font-medium text-slate-200">
                        Last name
                      </label>
                      <input
                        id="last-name"
                        name="last-name"
                        type="text"
                        placeholder="Chen"
                        className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="email" className="text-sm font-medium text-slate-200">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="maya@example.com"
                        className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="mt-4 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Join the queue
                  </button>
                </form>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold text-white">Tidal song search</h3>
                  <p className="mt-1 text-slate-400">
                    Search the playlist or the full catalog before submitting a request.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="rounded-full border border-cyan-400/40 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100">
                      Playlist
                    </button>
                    <button className="rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200">
                      Full catalog
                    </button>
                  </div>
                  <label htmlFor="search-song" className="mt-4 block text-sm font-medium text-slate-200">
                    Search songs
                  </label>
                  <input
                    id="search-song"
                    name="search-song"
                    type="search"
                    placeholder="Search by title, artist, or album"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                      <p className="font-medium text-white">Suggested result</p>
                      <p className="text-slate-400">Shallow — Lady Gaga & Bradley Cooper</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                      <p className="font-medium text-white">Suggested result</p>
                      <p className="text-slate-400">Dreams — Fleetwood Mac</p>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Live queue" eyebrow="Realtime control">
                <div className="space-y-3">
                  {queueItems.map((item) => (
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
            <Panel title="Band management" eyebrow="Back office">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold text-white">Show creation</h3>
                  <p className="mt-1 text-slate-400">
                    Create unique containers for dates and venues so each performance has its own queue.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold text-white">Band profile</h3>
                  <p className="mt-1 text-slate-400">Logo, name, social links, website, and payment settings.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
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
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold text-white">Payment links</h3>
                  <ul className="mt-3 space-y-2 text-slate-300">
                    <li>PayPal — band tip link</li>
                    <li>Venmo — quick tip link</li>
                    <li>CashApp — backup tip link</li>
                  </ul>
                  <p className="mt-3 text-sm text-slate-400">
                    Singers can also send a custom message alongside their tip.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel title="SaaS admin" eyebrow="Platform control">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-base font-semibold text-white">Manage bands</h3>
                  <p className="mt-1 text-slate-400">CRUD bands and members from a single control panel.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-base font-semibold text-white">User management</h3>
                  <p className="mt-1 text-slate-400">CRUD singers, hosts, and admins without leaving the app.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-base font-semibold text-white">System analytics</h3>
                  <p className="mt-1 text-slate-400">Track live usage, queue volume, and active show health.</p>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          <h2 className="text-2xl font-semibold text-white">Phase 1 coverage</h2>
          <ul className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {singerActions.map((action) => (
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
