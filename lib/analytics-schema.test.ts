import { describe, expect, it } from 'vitest'
import { getAnalyticsEventNames, getAnalyticsProhibitedData, getAnalyticsTrackingPlan } from './analytics-schema'

describe('analytics schema helpers', () => {
  it('exposes the canonical tracking plan', () => {
    const plan = getAnalyticsTrackingPlan()

    expect(plan.namingConventions).toHaveLength(4)
    expect(plan.requiredMetadata).toContain('occurredAt timestamp')
    expect(plan.prohibitedData).toContain('raw card numbers, CVC, or any payment instrument secret')
    expect(plan.eventSpecs.some((event) => event.name === 'pricing.checkout.started')).toBe(true)
    expect(plan.eventSpecs.some((event) => event.name === 'venue.lead.page.viewed')).toBe(true)
    expect(plan.eventSpecs.some((event) => event.name === 'subscription.started')).toBe(true)
  })

  it('lists the expected event names', () => {
    expect(getAnalyticsEventNames()).toEqual(
      expect.arrayContaining([
        'pricing.page.viewed',
        'pricing.checkout.completed',
        'show.started',
        'venue.lead.created',
      ])
    )
  })

  it('surfaces the prohibited data list directly', () => {
    expect(getAnalyticsProhibitedData()).toContain('passwords, API keys, session tokens, or OAuth credentials')
  })
})
