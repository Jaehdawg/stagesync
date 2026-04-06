import type { Metadata } from 'next'
import Link from 'next/link'
import { getPaymentBoundaryRules, getPaymentBoundarySummary } from '@/lib/payment-boundary'
import { getTermsAcceptancePrompt, getTermsSections } from '@/lib/terms-copy'

export const metadata: Metadata = {
  title: 'Terms / Terms of Service | StageSync',
  description: 'StageSync terms of service shell.',
}

export default function TermsPage() {
  const paymentBoundaryRules = getPaymentBoundaryRules()
  const termsSections = getTermsSections()
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.08),_transparent_28%),#f8fafc] px-4 py-10 text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),_transparent_28%),#020617] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-300">Legal</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Terms / Terms of Service
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-700 dark:text-slate-300">
            These terms set the service boundaries for StageSync. They are meant to be visible before any paid flow, account upgrade, or operational action that depends on them.
          </p>

          <section className="mt-8 grid gap-4">
            {termsSections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Payments and billing</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {getPaymentBoundarySummary()}
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {paymentBoundaryRules.map((rule) => (
                  <li key={rule.title} className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
                    <p className="font-semibold text-slate-950 dark:text-white">{rule.title}</p>
                    <p className="mt-1">{rule.detail}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Acceptance</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                Some actions may require explicit acceptance before they proceed. When that happens, the acknowledgment belongs at the point of use, not buried elsewhere.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {getTermsAcceptancePrompt()}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Related pages</h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
                <Link href="/privacy" className="text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300">
                  Privacy Policy
                </Link>
                <Link href="/support" className="text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300">
                  Support
                </Link>
              </div>
            </article>
          </section>
        </div>
      </div>
    </main>
  )
}
