import { describe, expect, it } from 'vitest'
import { getPaymentBoundaryRules, getPaymentBoundarySummary } from './payment-boundary'

describe('payment boundary helpers', () => {
  it('describes the hosted payment boundary and security rules', () => {
    expect(getPaymentBoundarySummary()).toContain('Stripe hosted flows')

    expect(getPaymentBoundaryRules()).toEqual([
      {
        title: 'Hosted payments only',
        detail: 'Checkout, billing portal, and invoice access stay in the provider-hosted flow instead of custom card forms inside StageSync.',
      },
      {
        title: 'No raw card storage',
        detail: 'StageSync must never store card numbers, CVC data, or other payment instrument secrets.',
      },
      {
        title: 'Webhook verification required',
        detail: 'Stripe webhook events are only trusted after signature verification with the configured webhook secret.',
      },
      {
        title: 'Provider metadata only',
        detail: 'StageSync may store provider IDs, statuses, and billing references, but not payment credentials.',
      },
    ])
  })
})
