import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support | StageSync',
  description: 'StageSync support contact shell.',
}

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Help</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Support</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          Support for StageSync is currently handled through the team running your workspace or band account.
        </p>

        <section className="mt-8 grid gap-4">
          <article className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              If something looks wrong, reach out to the StageSync operator or the person who invited your band to the service.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <h2 className="text-lg font-semibold text-white">Billing help</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              For payment questions, use the hosted billing portal or receipts flow so payment data stays outside StageSync’s card-handling boundary.
            </p>
          </article>
        </section>
      </div>
    </main>
  )
}
