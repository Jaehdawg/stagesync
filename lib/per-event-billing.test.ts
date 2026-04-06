import { describe, expect, it } from 'vitest'
import { buildPerEventCreditPurchaseLedgerEntry, getPerEventBillingStatusMessage, resolvePerEventBillingRedirect } from './per-event-billing'

describe('per-event billing helpers', () => {
  it('resolves per-event billing redirects and notices', () => {
    expect(resolvePerEventBillingRedirect('purchase', { checkoutUrl: 'https://billing.example.com/checkout' })).toEqual({
      url: 'https://billing.example.com/checkout',
      notice: null,
    })

    expect(resolvePerEventBillingRedirect('purchase', { checkoutUrl: null })).toEqual({
      url: null,
      notice: 'credit-checkout-pending',
    })

    expect(resolvePerEventBillingRedirect('receipts', { receiptsUrl: 'https://billing.example.com/receipts' })).toEqual({
      url: 'https://billing.example.com/receipts',
      notice: null,
    })

    expect(getPerEventBillingStatusMessage('checkout-complete')).toContain('completed')
    expect(getPerEventBillingStatusMessage('checkout-canceled')).toContain('canceled')
  })

  it('builds a hosted credit purchase ledger entry', () => {
    expect(
      buildPerEventCreditPurchaseLedgerEntry({
        bandId: 'band-1',
        billingAccountId: 'acct-1',
        providerReference: 'cs_test_123',
        createdAt: new Date('2026-04-05T15:00:00.000Z'),
      })
    ).toEqual({
      bandId: 'band-1',
      eventId: null,
      billingAccountId: 'acct-1',
      entryType: 'credit_purchase',
      amount: 1,
      provider: 'hosted',
      providerReference: 'cs_test_123',
      note: 'Per-event credit purchase',
      createdAt: '2026-04-05T15:00:00.000Z',
    })
  })
})
