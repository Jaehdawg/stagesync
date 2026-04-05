import { describe, expect, it } from 'vitest'
import { normalizeBillingLifecycleStatus, resolveBillingLifecycleUpdate } from './billing-lifecycle'

describe('billing lifecycle helpers', () => {
  it('normalizes provider statuses that StageSync understands', () => {
    expect(normalizeBillingLifecycleStatus('free')).toBe('free')
    expect(normalizeBillingLifecycleStatus('trialing')).toBe('trialing')
    expect(normalizeBillingLifecycleStatus('active')).toBe('active')
    expect(normalizeBillingLifecycleStatus('grace')).toBe('grace')
    expect(normalizeBillingLifecycleStatus('past_due')).toBe('past_due')
    expect(normalizeBillingLifecycleStatus('canceled')).toBe('canceled')
    expect(normalizeBillingLifecycleStatus('suspended')).toBe('suspended')
    expect(normalizeBillingLifecycleStatus('trial')).toBe(null)
  })

  it('builds a minimal subscription update from lifecycle payloads', () => {
    expect(
      resolveBillingLifecycleUpdate({
        status: 'trialing',
        paymentProvider: 'stripe',
        paymentCustomerId: 'cus_123',
        paymentSubscriptionId: 'sub_123',
      })
    ).toEqual({
      status: 'trialing',
      paymentProvider: 'stripe',
      paymentCustomerId: 'cus_123',
      paymentSubscriptionId: 'sub_123',
    })

    expect(
      resolveBillingLifecycleUpdate({
        status: 'canceled',
        paymentProvider: 'stripe',
        paymentSubscriptionId: 'sub_999',
      })
    ).toEqual({
      status: 'canceled',
      paymentProvider: 'stripe',
      paymentCustomerId: undefined,
      paymentSubscriptionId: 'sub_999',
    })

    expect(resolveBillingLifecycleUpdate({ status: 'trialing' })).toEqual({ status: 'trialing', paymentProvider: undefined, paymentCustomerId: undefined, paymentSubscriptionId: undefined })
    expect(resolveBillingLifecycleUpdate({})).toBeNull()
  })
})
