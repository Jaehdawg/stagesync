import Link from 'next/link'

import { homeCopy } from '@/content/en/home'

function VisualMockup() {
  return (
    <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-950/70 dark:shadow-cyan-950/20">
      <div className="rounded-[1.5rem] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-fuchsia-50 p-4 dark:border-cyan-400/20 dark:from-cyan-400/15 dark:via-slate-950 dark:to-fuchsia-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Live show</p>
            <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Neon Echo</p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200">
            Signups open
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          {[
            ['Queue', '12'],
            ['Singers', '7'],
            ['Set lists', '3'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-700 dark:text-fuchsia-200">Song library</p>
          <div className="mt-4 space-y-3">
            {[
              ['Dreams', 'Fleetwood Mac'],
              ['Maps', 'Yeah Yeah Yeahs'],
              ['Mr. Brightside', 'The Killers'],
            ].map(([song, artist], index) => (
              <div key={song} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/60">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{song}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{artist}</p>
                </div>
                <div className="h-3 w-3 rounded-full bg-cyan-400/80" style={{ opacity: 0.5 + index * 0.2 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200">Singer view</p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/70">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Avery</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Now singing</p>
          </div>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/70">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Next up</p>
            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">Maps</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Yeah Yeah Yeahs</p>
          </div>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/70">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Sign-up link</p>
            <p className="mt-2 break-all text-xs text-cyan-700 dark:text-cyan-200">stagesync.example/singer?band=neon-echo</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HomepageLanding() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),_transparent_28%),#f8fafc] px-4 py-6 text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.14),_transparent_28%),#020617] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-slate-900 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-300">{homeCopy.eyebrow}</p>
          </div>
          <nav className="hidden gap-3 text-sm font-medium md:flex">
            <Link href="#learn-more" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-900 hover:border-cyan-400/50 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
              {homeCopy.topNav.learnMore}
            </Link>
            <Link href="#free-trial" className="rounded-full bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">
              {homeCopy.topNav.startFreeTrial}
            </Link>
          </nav>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
              {homeCopy.hero.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl dark:text-slate-300">
              {homeCopy.hero.subhead}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/band" className="rounded-full bg-cyan-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">
                {homeCopy.hero.primaryCta}
              </Link>
              <Link href="#learn-more" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-cyan-400/50 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-cyan-400/50 dark:hover:bg-white/10">
                {homeCopy.hero.secondaryCta}
              </Link>
            </div>
          </div>

          <VisualMockup />
        </section>

        <section id="learn-more" className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white/90 p-6 lg:grid-cols-[0.8fr_1.2fr] lg:p-8 dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">{homeCopy.howItWorks.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">{homeCopy.howItWorks.title}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {homeCopy.howItWorks.steps.map((step) => (
              <article key={step.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 lg:p-8 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">{homeCopy.audiences.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">{homeCopy.audiences.title}</h2>
            <div className="mt-6 grid gap-4">
              {homeCopy.audiences.items.map((item) => (
                <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 lg:p-8 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">{homeCopy.benefits.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">{homeCopy.benefits.title}</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {homeCopy.benefits.items.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div id="free-trial" className="rounded-[2rem] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-fuchsia-50 p-6 lg:p-8 dark:border-cyan-400/20 dark:from-cyan-400/10 dark:via-slate-950 dark:to-fuchsia-500/10">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">{homeCopy.trial.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">{homeCopy.trial.title}</h2>
              <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">{homeCopy.trial.body}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/band" className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">
                  {homeCopy.trial.cta}
                </Link>
                <Link href="#pricing" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:border-cyan-400/50 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-cyan-400/50 dark:hover:bg-white/10">
                  {homeCopy.trial.secondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 lg:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">{homeCopy.pricing.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">{homeCopy.pricing.title}</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {homeCopy.pricing.items.map((item) => (
              <article key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.note}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
