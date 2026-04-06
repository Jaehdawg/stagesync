import { describe, expect, it, vi } from 'vitest'
import { buildAnalyticsEventRecord, normalizeAnalyticsEventName, recordAnalyticsEvent } from './analytics-events'

describe('analytics event helpers', () => {
  it('normalizes canonical event names', () => {
    expect(normalizeAnalyticsEventName('pricing.checkout.started')).toBe('pricing.checkout.started')
    expect(normalizeAnalyticsEventName('nope')).toBeNull()
  })

  it('builds append-only analytics records', () => {
    const record = buildAnalyticsEventRecord({
      eventName: 'pricing.page.viewed',
      source: 'homepage',
      properties: { section: 'pricing' },
    })

    expect(record).toMatchObject({
      event_name: 'pricing.page.viewed',
      source: 'homepage',
      properties: { section: 'pricing' },
      actor_role: 'system',
    })
  })

  it('stores analytics events through the provided client', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const client = { from: vi.fn(() => ({ insert })) }

    const result = await recordAnalyticsEvent(client, {
      eventName: 'trial.started',
      source: 'hero cta',
      bandId: 'band-1',
      actorRole: 'band',
      properties: { plan: 'free' },
    })

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      event_name: 'trial.started',
      band_id: 'band-1',
      actor_role: 'band',
    }))
    expect(result.error).toBeNull()
  })
})
