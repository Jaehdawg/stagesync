import { describe, expect, it } from 'vitest'
import {
  FREE_SHOWS_PER_BAND,
  buildBillingAccount,
  getFreeShowsRemaining,
  isPaymentOutsidePCIBoundary,
  makeHostedPaymentBoundary,
} from './billing'

describe('billing helpers', () => {
  it('builds a default billing account for a band', () => {
    expect(buildBillingAccount({ bandId: 'band-1' })).toEqual({
      bandId: 'band-1',
      status: 'free',
      freeShowsAllocated: FREE_SHOWS_PER_BAND,
      freeShowsUsed: 0,
      paymentProvider: null,
      paymentCustomerId: null,
      paymentSubscriptionId: null,
    })
  })

  it('tracks free shows remaining from the allocated count', () => {
    expect(getFreeShowsRemaining({ freeShowsAllocated: 3, freeShowsUsed: 1 })).toBe(2)
    expect(getFreeShowsRemaining({ freeShowsAllocated: 3, freeShowsUsed: 4 })).toBe(0)
  })

  it('marks hosted payment flows as outside the PCI boundary', () => {
    const boundary = makeHostedPaymentBoundary({
      providerName: 'stripe',
      customerId: 'cus_123',
      sessionId: 'cs_test_123',
      subscriptionId: 'sub_123',
    })

    expect(boundary).toEqual({
      provider: 'hosted',
      providerName: 'stripe',
      customerId: 'cus_123',
      sessionId: 'cs_test_123',
      subscriptionId: 'sub_123',
      isOutsidePCI: true,
    })
    expect(isPaymentOutsidePCIBoundary(boundary)).toBe(true)
  })
})
