import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms / Terms of Service | StageSync',
  description: 'StageSync terms and terms of service shell.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.08),_transparent_28%),#f8fafc] px-4 py-10 text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),_transparent_28%),#020617] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-300">Legal</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Terms / Terms of Service
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-700 dark:text-slate-300">
            This page is the legal shell for StageSync. It exists so the site can present clear terms before any paid flow is introduced.
          </p>

          <section className="mt-8 grid gap-4">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Use of the service</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                StageSync is provided to help bands, venues, and singers manage live-show workflows. Access to paid features will be governed by the applicable plan, account status, and the terms on this page.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Payments and billing</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                Payment flows will be hosted outside StageSync’s PCI boundary. Checkout, subscription, and invoice experiences are intentionally not implemented yet.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Acceptance</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                If a future workflow needs explicit acceptance, it should surface that requirement only at the point of use. For now, this page is the visible legal shell and footer destination.
              </p>
            </article>
          </section>
        </div>
      </div>
    </main>
  )
}
