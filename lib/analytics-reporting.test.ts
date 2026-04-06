import { describe, expect, it } from 'vitest'
import { buildAnalyticsSections, formatRatio, getAnalyticsEventTypes } from './analytics-reporting'

describe('analytics reporting helpers', () => {
  it('formats ratios defensively', () => {
    expect(formatRatio(2, 4)).toBe('50%')
    expect(formatRatio(0, 0)).toBe('—')
  })

  it('builds reporting sections for the analytics dashboard', () => {
    const sections = buildAnalyticsSections({
      bandCount: 5,
      showCount: 12,
      activeShowCount: 3,
      recentShowCount: 4,
      singerCount: 18,
      tracksPlayedCount: 39,
    })

    expect(sections.funnel.title).toBe('Core funnel')
    expect(sections.retention.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Recent shows', value: '4' }),
        expect.objectContaining({ label: 'Live / total shows', value: '25%' }),
      ])
    )
    expect(sections.storage.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'analytics_events' }),
        expect.objectContaining({ value: 'analytics_daily_rollups' }),
      ])
    )
  })

  it('lists the analytics event types we expect to capture later', () => {
    expect(getAnalyticsEventTypes()).toContain('show.started')
    expect(getAnalyticsEventTypes()).toContain('billing.credit.purchased')
  })
})
