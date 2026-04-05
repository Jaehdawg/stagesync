import { describe, expect, it } from 'vitest'
import {
  FREE_SHOWS_PER_BAND,
  buildCreditConsumptionEntry,
  buildCreditPurchaseEntry,
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

  it('builds credit purchase and consumption ledger entries', () => {
    expect(
      buildCreditPurchaseEntry({
        bandId: 'band-1',
        billingAccountId: 'acct-1',
        amount: 1,
        provider: 'stripe',
        providerReference: 'cs_test_123',
        note: 'Per-event credit purchase',
        createdAt: new Date('2026-04-05T14:00:00.000Z'),
      })
    ).toEqual({
      bandId: 'band-1',
      eventId: null,
      billingAccountId: 'acct-1',
      entryType: 'credit_purchase',
      amount: 1,
      provider: 'stripe',
      providerReference: 'cs_test_123',
      note: 'Per-event credit purchase',
      createdAt: '2026-04-05T14:00:00.000Z',
    })

    expect(
      buildCreditConsumptionEntry({
        bandId: 'band-1',
        eventId: 'event-1',
        billingAccountId: 'acct-1',
        createdAt: new Date('2026-04-05T14:00:10.000Z'),
      })
    ).toEqual({
      bandId: 'band-1',
      eventId: 'event-1',
      billingAccountId: 'acct-1',
      entryType: 'credit_consumed',
      amount: 1,
      provider: null,
      providerReference: null,
      note: null,
      createdAt: '2026-04-05T14:00:10.000Z',
    })
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
