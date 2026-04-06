import { describe, expect, it } from 'vitest'
import { resolveHostedBillingRedirect } from './hosted-billing'

describe('hosted billing helpers', () => {
  it('maps intents to hosted URLs when config is present', () => {
    expect(
      resolveHostedBillingRedirect('upgrade', {
        checkoutUrl: 'https://billing.example.com/checkout',
        portalUrl: 'https://billing.example.com/portal',
        invoicesUrl: 'https://billing.example.com/invoices',
      })
    ).toEqual({ url: 'https://billing.example.com/checkout', notice: null })

    expect(
      resolveHostedBillingRedirect('manage', {
        checkoutUrl: null,
        portalUrl: 'https://billing.example.com/portal',
        invoicesUrl: null,
      })
    ).toEqual({ url: 'https://billing.example.com/portal', notice: null })

    expect(
      resolveHostedBillingRedirect('invoices', {
        checkoutUrl: null,
        portalUrl: 'https://billing.example.com/portal',
        invoicesUrl: 'https://billing.example.com/invoices',
      })
    ).toEqual({ url: 'https://billing.example.com/invoices', notice: null })
  })

  it('falls back to placeholder notices when hosted URLs are missing', () => {
    expect(resolveHostedBillingRedirect('upgrade', {})).toEqual({ url: null, notice: 'checkout-pending' })
    expect(resolveHostedBillingRedirect('manage', {})).toEqual({ url: null, notice: 'portal-pending' })
    expect(resolveHostedBillingRedirect('downgrade', {})).toEqual({ url: null, notice: 'downgrade-pending' })
    expect(resolveHostedBillingRedirect('stay', {})).toEqual({ url: null, notice: 'no-change' })
    expect(resolveHostedBillingRedirect('invoices', {})).toEqual({ url: null, notice: 'invoices-pending' })
  })
})
