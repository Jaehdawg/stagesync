import type { Metadata } from 'next'
import Link from 'next/link'
import { AnalyticsPageView } from '@/components/analytics-page-view'
import { getVenueLeadInterestOptions, getVenueLeadQuestions, getVenueLeadStatusMessage } from '@/lib/venue-leads'

export const metadata: Metadata = {
  title: 'Venue Sales | StageSync',
  description: 'Request a StageSync demo or contact sales for venue pricing and configuration.',
}

type SearchParams = Record<string, string | string[] | undefined>

export default async function VenuesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const leadNotice = typeof params?.leadNotice === 'string' ? params.leadNotice : undefined
  const questions = getVenueLeadQuestions()
  const interestOptions = getVenueLeadInterestOptions()
  const leadMessage = getVenueLeadStatusMessage(leadNotice)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),_transparent_28%),#f8fafc] px-4 py-8 text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),_transparent_28%),#020617] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <AnalyticsPageView eventName="venue.lead.page.viewed" source="venues" />
        <header className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-300">Venue sales</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">Request a demo or contact sales</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700 dark:text-slate-300">
            Tell us about the venue, rooms, and bands you manage. We’ll route the inquiry to the venue sales workflow for follow-up and qualification.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/terms" className="rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-slate-900 transition hover:border-cyan-400/50 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Terms</Link>
            <Link href="/privacy" className="rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-slate-900 transition hover:border-cyan-400/50 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Privacy</Link>
            <Link href="/support" className="rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-slate-900 transition hover:border-cyan-400/50 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Support</Link>
          </div>
        </header>

        {leadMessage ? (
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 shadow-sm dark:bg-cyan-400/10 dark:text-cyan-100">
            {leadMessage}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-300">Why venues use StageSync</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>• Multi-room operator reporting and simple access control</li>
              <li>• Show state, queue, and singer activity in one place</li>
              <li>• Support for custom pricing and venue configuration</li>
              <li>• Internal routing for demo, pricing, and ready-to-buy leads</li>
            </ul>
          </div>

          <form action="/api/venues/leads" method="post" className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-300">Lead capture</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">Venue qualification form</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {questions.map((question) => {
                if (question.name === 'interestLevel') {
                  return (
                    <label key={question.name} className="sm:col-span-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{question.label}</span>
                      <select
                        name={question.name}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
                      >
                        {interestOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{question.hint}</p>
                    </label>
                  )
                }

                if (question.name === 'message') {
                  return (
                    <label key={question.name} className="sm:col-span-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{question.label}</span>
                      <textarea
                        name={question.name}
                        rows={4}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
                      />
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{question.hint}</p>
                    </label>
                  )
                }

                if (question.name === 'roomsCount' || question.name === 'bandsCount') {
                  return (
                    <label key={question.name}>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{question.label}</span>
                      <input
                        name={question.name}
                        type="number"
                        min="0"
                        required={question.required}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
                      />
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{question.hint}</p>
                    </label>
                  )
                }

                return (
                  <label key={question.name}>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{question.label}</span>
                    <input
                      name={question.name}
                      required={question.required}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
                    />
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{question.hint}</p>
                  </label>
                )
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">Submit venue inquiry</button>
              <Link href="/" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-400/50 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Back home</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
