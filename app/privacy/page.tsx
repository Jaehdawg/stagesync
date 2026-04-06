import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | StageSync',
  description: 'StageSync privacy policy shell.',
}

const privacyPoints = [
  {
    title: 'Account and show data',
    detail: 'StageSync stores account, band, show, queue, and billing references needed to run the service.',
  },
  {
    title: 'Payment boundary',
    detail: 'Payment credentials stay with the hosted payment provider; StageSync only retains provider IDs, statuses, and billing references.',
  },
  {
    title: 'Operational logs',
    detail: 'StageSync may keep logs needed for debugging, abuse prevention, and service reliability.',
  },
  {
    title: 'Sharing',
    detail: 'Data is shared only with service providers required to operate hosting, authentication, and billing.',
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Legal</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Privacy Policy</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          This page explains the current privacy boundaries for StageSync. It should be replaced with final policy language before launch.
        </p>

        <section className="mt-8 grid gap-4">
          {privacyPoints.map((point) => (
            <article key={point.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <h2 className="text-lg font-semibold text-white">{point.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{point.detail}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
