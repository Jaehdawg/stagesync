import Link from 'next/link'

import { homeCopy } from '@/content/en/home'

function VisualMockup() {
  return (
    <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-2xl shadow-cyan-950/20">
      <div className="rounded-[1.5rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 via-slate-950 to-fuchsia-500/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Live show</p>
            <p className="mt-1 text-lg font-semibold text-white">Neon Echo</p>
          </div>
          <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Signups open
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          {[
            ['Queue', '12'],
            ['Singers', '7'],
            ['Set lists', '3'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-200">Song library</p>
          <div className="mt-4 space-y-3">
            {[
              ['Dreams', 'Fleetwood Mac'],
              ['Maps', 'Yeah Yeah Yeahs'],
              ['Mr. Brightside', 'The Killers'],
            ].map(([song, artist], index) => (
              <div key={song} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-white">{song}</p>
                  <p className="text-xs text-slate-400">{artist}</p>
                </div>
                <div className="h-3 w-3 rounded-full bg-cyan-400/80" style={{ opacity: 0.5 + index * 0.2 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">Singer view</p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3">
            <p className="text-sm font-semibold text-white">Avery</p>
            <p className="mt-1 text-xs text-slate-400">Now singing</p>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Next up</p>
            <p className="mt-2 text-sm font-semibold text-white">Maps</p>
            <p className="text-xs text-slate-400">Yeah Yeah Yeahs</p>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sign-up link</p>
            <p className="mt-2 break-all text-xs text-cyan-200">stagesync.example/singer?band=neon-echo</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HomepageLanding() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.14),_transparent_28%),#020617] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">{homeCopy.eyebrow}</p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium">
            <Link href="#learn-more" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white hover:border-cyan-400/50">
              {homeCopy.topNav.learnMore}
            </Link>
            <Link href="#free-trial" className="rounded-full bg-cyan-400 px-4 py-2 text-slate-950 hover:bg-cyan-300">
              {homeCopy.topNav.startFreeTrial}
            </Link>
          </nav>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
              {homeCopy.hero.badge}
            </p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {homeCopy.hero.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              {homeCopy.hero.subhead}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/band" className="rounded-full bg-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-300">
                {homeCopy.hero.primaryCta}
              </Link>
              <Link href="#learn-more" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:border-cyan-400/50 hover:bg-white/10">
                {homeCopy.hero.secondaryCta}
              </Link>
            </div>
            <p className="mt-5 max-w-2xl text-sm text-slate-400">{homeCopy.hero.footnote}</p>

            <div className="mt-10 flex flex-wrap gap-3">
              {homeCopy.proof.items.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <VisualMockup />
        </section>

        <section id="learn-more" className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{homeCopy.howItWorks.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{homeCopy.howItWorks.title}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {homeCopy.howItWorks.steps.map((step) => (
              <article key={step.title} className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{homeCopy.audiences.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{homeCopy.audiences.title}</h2>
            <div className="mt-6 grid gap-4">
              {homeCopy.audiences.items.map((item) => (
                <article key={item.title} className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{homeCopy.benefits.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{homeCopy.benefits.title}</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {homeCopy.benefits.items.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm leading-6 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div id="free-trial" className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-950 to-fuchsia-500/10 p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{homeCopy.trial.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{homeCopy.trial.title}</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">{homeCopy.trial.body}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/band" className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
                  {homeCopy.trial.cta}
                </Link>
                <Link href="#pricing" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:border-cyan-400/50 hover:bg-white/10">
                  {homeCopy.trial.secondaryCta}
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-400">{homeCopy.trial.note}</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="rounded-[2rem] border border-white/10 bg-white/5 p-6 lg:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{homeCopy.pricing.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{homeCopy.pricing.title}</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {homeCopy.pricing.items.map((item) => (
              <article key={item.label} className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.note}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
