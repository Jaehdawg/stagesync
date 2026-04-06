export type AnalyticsReportCounts = {
  bandCount: number
  showCount: number
  activeShowCount: number
  recentShowCount: number
  singerCount: number
  tracksPlayedCount: number
}

export type AnalyticsMetric = {
  label: string
  value: string
  detail: string
}

export type AnalyticsSection = {
  title: string
  description: string
  items: AnalyticsMetric[]
}

export type AnalyticsStorageNote = {
  title: string
  detail: string
}

export function formatRatio(numerator: number, denominator: number) {
  if (!denominator) return '—'
  return `${Math.round((numerator / denominator) * 100)}%`
}

export function buildAnalyticsSections(counts: AnalyticsReportCounts) {
  const funnel: AnalyticsSection = {
    title: 'Core funnel',
    description: 'A top-of-funnel view of how many bands, shows, singers, and song completions the product is supporting.',
    items: [
      { label: 'Bands onboarded', value: String(counts.bandCount), detail: 'Bands with live profiles or account access.' },
      { label: 'Shows created', value: String(counts.showCount), detail: 'Every show record currently stored.' },
      { label: 'Shows live now', value: String(counts.activeShowCount), detail: `${formatRatio(counts.activeShowCount, counts.showCount)} of all shows are currently active.` },
      { label: 'Singer accounts', value: String(counts.singerCount), detail: 'Distinct singer profiles ready to join a queue.' },
    ],
  }

  const retention: AnalyticsSection = {
    title: 'Retention and churn',
    description: 'A lightweight view of recent activity and inactive shows so operators can spot stalled usage.',
    items: [
      { label: 'Recent shows', value: String(counts.recentShowCount), detail: 'Shows created in the last 30 days.' },
      { label: 'Inactive shows', value: String(Math.max(counts.showCount - counts.activeShowCount, 0)), detail: 'Shows that are no longer live.' },
      { label: 'Live / total shows', value: formatRatio(counts.activeShowCount, counts.showCount), detail: 'Simple health signal for the current fleet.' },
      { label: 'Track completions', value: String(counts.tracksPlayedCount), detail: 'Completed queue items across the system.' },
    ],
  }

  const usage: AnalyticsSection = {
    title: 'Band / singer usage',
    description: 'Usage summaries for the two main audiences: bands operating shows and singers requesting songs.',
    items: [
      { label: 'Bands with shows', value: String(counts.bandCount), detail: 'Bands that have created at least one show record.' },
      { label: 'Singers onboarded', value: String(counts.singerCount), detail: 'Account-level singer usage and sign-up base.' },
      { label: 'Tracks played', value: String(counts.tracksPlayedCount), detail: 'Songs completed through the queue.' },
      { label: 'Recent activity', value: String(counts.recentShowCount), detail: 'Helps distinguish active markets from dormant ones.' },
    ],
  }

  const storage: AnalyticsSection = {
    title: 'Storage and export expectations',
    description: 'Durable analytics storage should keep raw events around for later rollups and exports instead of only surfacing aggregated counts.',
    items: [
      { label: 'Raw event log', value: 'analytics_events', detail: 'Append-only event capture for product, funnel, and lifecycle events.' },
      { label: 'Daily rollups', value: 'analytics_daily_rollups', detail: 'Precomputed summaries for dashboards and CSV exports.' },
      { label: 'CSV export', value: 'planned', detail: 'Operator-exportable reporting should come from rollups, not ad hoc query copies.' },
      { label: 'Scope', value: 'band-scoped', detail: 'Analytics should stay partitioned by band where applicable.' },
    ],
  }

  return { funnel, retention, usage, storage }
}

export function getAnalyticsEventTypes() {
  return [
    'band.created',
    'show.created',
    'show.started',
    'show.paused',
    'show.ended',
    'singer.joined',
    'queue.song.completed',
    'billing.credit.purchased',
  ] as const
}
