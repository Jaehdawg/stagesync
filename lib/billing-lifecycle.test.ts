import { describe, expect, it } from 'vitest'
import { normalizeBillingLifecycleStatus, resolveBillingLifecycleUpdate } from './billing-lifecycle'

describe('billing lifecycle helpers', () => {
  it('normalizes provider statuses that StageSync understands', () => {
    expect(normalizeBillingLifecycleStatus('active')).toBe('active')
    expect(normalizeBillingLifecycleStatus('grace')).toBe('grace')
    expect(normalizeBillingLifecycleStatus('trialing')).toBe(null)
    expect(normalizeBillingLifecycleStatus('canceled')).toBe(null)
  })

  it('builds a minimal subscription update from lifecycle payloads', () => {
    expect(
      resolveBillingLifecycleUpdate({
        status: 'past_due',
        paymentProvider: 'stripe',
        paymentCustomerId: 'cus_123',
        paymentSubscriptionId: 'sub_123',
      })
    ).toEqual({
      status: 'past_due',
      paymentProvider: 'stripe',
      paymentCustomerId: 'cus_123',
      paymentSubscriptionId: 'sub_123',
    })

    expect(resolveBillingLifecycleUpdate({ status: 'trialing' })).toBeNull()
  })
})
