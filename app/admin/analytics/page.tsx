import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { getAdminAccess } from '@/lib/admin-access'
import { buildAnalyticsSections } from '@/lib/analytics-reporting'
import { getAnalyticsTrackingPlan } from '@/lib/analytics-schema'
import { adminCopy } from '@/content/en/admin'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const liveAdminAccess = await getAdminAccess(supabase)

  if (!liveAdminAccess) {
    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
            <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.analyticsPage.title}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{adminCopy.login.description}</p>
            </header>
            <BandAccessForm
              role="admin"
              title={adminCopy.login.title}
              description={adminCopy.login.description}
              submitLabel={adminCopy.login.submitLabel}
              successMessage={adminCopy.login.successMessage}
              endpoint="/api/auth/login"
            />
          </div>
        </main>
      )
  }

  const serviceSupabase = createServiceClient()
  const [summaryResult, recentShowsResult] = await Promise.all([
    serviceSupabase.rpc('get_admin_analytics_summary'),
    serviceSupabase.rpc('get_admin_recent_shows', { limit_count: 5 }),
  ])

  const summary = summaryResult.data?.[0] ?? {
    band_count: 0,
    show_count: 0,
    active_show_count: 0,
    singer_count: 0,
    tracks_played_count: 0,
    recent_show_count: 0,
  }

  const analyticsSections = buildAnalyticsSections({
    bandCount: summary.band_count ?? 0,
    showCount: summary.show_count ?? 0,
    activeShowCount: summary.active_show_count ?? 0,
    recentShowCount: summary.recent_show_count ?? 0,
    singerCount: summary.singer_count ?? 0,
    tracksPlayedCount: summary.tracks_played_count ?? 0,
  })
  const trackingPlan = getAnalyticsTrackingPlan()

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.analyticsPage.title}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                {adminCopy.analyticsPage.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/api/admin/analytics/export" className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100 hover:border-cyan-400/50">
                Export CSV
              </a>
              <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">
                {adminCopy.backToAdmin}
              </Link>
            </div>
          </div>
          <form className="mt-4" action="/api/auth/logout" method="post">
            <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
              {adminCopy.logoutLabel}
            </button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: adminCopy.analyticsPage.metrics.bandShows, value: String(summary.band_count ?? 0) },
            { label: adminCopy.analyticsPage.metrics.activeShow, value: String(summary.active_show_count ?? 0) },
            { label: adminCopy.analyticsPage.metrics.singerCount, value: String(summary.singer_count ?? 0) },
            { label: adminCopy.analyticsPage.metrics.tracksPlayed, value: String(summary.tracks_played_count ?? 0) },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </section>

        {[
          analyticsSections.funnel,
          analyticsSections.retention,
          analyticsSections.usage,
          analyticsSections.storage,
        ].map((section) => (
          <section key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">{section.description}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {section.items.map((item) => (
                <article key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">{adminCopy.analyticsPage.trackingTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">{adminCopy.analyticsPage.trackingDescription}</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-semibold text-white">Naming conventions</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {trackingPlan.namingConventions.map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-cyan-300">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-semibold text-white">Required metadata</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {trackingPlan.requiredMetadata.map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-cyan-300">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-semibold text-white">Must never be logged</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {trackingPlan.prohibitedData.map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-rose-300">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-semibold text-white">Canonical event names</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {trackingPlan.eventSpecs.map((event) => (
                  <li key={event.name} className="flex items-start gap-2">
                    <span className="text-cyan-300">•</span>
                    <span><span className="font-medium text-white">{event.name}</span> — {event.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">{adminCopy.analyticsPage.recentShowsTitle}</h2>
          <div className="mt-4 space-y-3">
            {(recentShowsResult.data ?? []).map((show) => (
              <div key={show.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{show.name}</p>
                    <p className="text-sm text-slate-400">{show.created_at}</p>
                  </div>
                  <div className="flex gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                    <span className="rounded-full border border-white/10 px-3 py-1">{show.is_active ? adminCopy.analyticsPage.activeLabel : adminCopy.analyticsPage.endedLabel}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">{show.allow_signups ? adminCopy.analyticsPage.signupsOn : adminCopy.analyticsPage.signupsOff}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
