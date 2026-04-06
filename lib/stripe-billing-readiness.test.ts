import { describe, expect, it } from 'vitest'
import { getStripeBillingReadiness } from './stripe-billing-readiness'

describe('stripe billing readiness helpers', () => {
  it('reports missing stripe keys and hosted urls', () => {
    expect(
      getStripeBillingReadiness(
        {
          secretKey: 'sk_test_123',
          webhookSecret: null,
          professionalPriceId: null,
        },
        {
          checkoutUrl: 'https://billing.example.com/checkout',
        }
      )
    ).toEqual({
      stripeCheckoutReady: false,
      stripeWebhookReady: false,
      hostedCheckoutReady: true,
      hostedPortalReady: false,
      hostedInvoicesReady: false,
      missingStripeKeys: ['STRIPE_WEBHOOK_SECRET', 'STAGESYNC_PRO_MONTHLY_PRICE_ID'],
    })
  })

  it('reports a ready config when stripe keys and hosted urls are set', () => {
    expect(
      getStripeBillingReadiness(
        {
          secretKey: 'sk_test_123',
          webhookSecret: 'whsec_123',
          professionalPriceId: 'price_123',
        },
        {
          checkoutUrl: 'https://billing.example.com/checkout',
          portalUrl: 'https://billing.example.com/portal',
          invoicesUrl: 'https://billing.example.com/invoices',
        }
      )
    ).toEqual({
      stripeCheckoutReady: true,
      stripeWebhookReady: true,
      hostedCheckoutReady: true,
      hostedPortalReady: true,
      hostedInvoicesReady: true,
      missingStripeKeys: [],
    })
  })
})
