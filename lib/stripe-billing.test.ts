import { describe, expect, it } from 'vitest'
import {
  buildStripeCheckoutRequest,
  buildStripePortalRequest,
  getStripeBillingConfig,
  hasStripeCheckoutConfig,
  getStripeWebhookCoverage,
  resolveStripeBillingLifecycleUpdate,
} from './stripe-billing'

describe('stripe billing helpers', () => {
  it('reads stripe billing config from env', () => {
    expect(
      getStripeBillingConfig({
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_123',
        STAGESYNC_PRO_MONTHLY_PRICE_ID: 'price_123',
      } as unknown as NodeJS.ProcessEnv)
    ).toEqual({
      secretKey: 'sk_test_123',
      webhookSecret: 'whsec_123',
      professionalPriceId: 'price_123',
    })
  })

  it('detects whether checkout config is complete', () => {
    expect(hasStripeCheckoutConfig({ secretKey: 'sk_test_123', webhookSecret: null, professionalPriceId: 'price_123' })).toBe(true)
    expect(hasStripeCheckoutConfig({ secretKey: null, webhookSecret: null, professionalPriceId: 'price_123' })).toBe(false)
  })

  it('builds hosted checkout and portal request payloads', () => {
    expect(
      buildStripeCheckoutRequest({
        bandId: 'band-1',
        bandName: 'Northside',
        customerEmail: 'northside@example.com',
        professionalPriceId: 'price_123',
        successUrl: 'https://app.example.com/band/account?subscriptionNotice=checkout-complete',
        cancelUrl: 'https://app.example.com/band/account?subscriptionNotice=checkout-canceled',
      })
    ).toEqual({
      mode: 'subscription',
      line_items: [{ price: 'price_123', quantity: 1 }],
      success_url: 'https://app.example.com/band/account?subscriptionNotice=checkout-complete',
      cancel_url: 'https://app.example.com/band/account?subscriptionNotice=checkout-canceled',
      customer_email: 'northside@example.com',
      metadata: {
        band_id: 'band-1',
        band_name: 'Northside',
        billing_source: 'stagesync',
      },
      subscription_data: {
        metadata: {
          band_id: 'band-1',
          band_name: 'Northside',
          billing_source: 'stagesync',
        },
      },
    })

    expect(
      buildStripePortalRequest({
        customerId: 'cus_123',
        returnUrl: 'https://app.example.com/band/account?subscriptionNotice=portal-return',
      })
    ).toEqual({
      customer: 'cus_123',
      return_url: 'https://app.example.com/band/account?subscriptionNotice=portal-return',
    })
  })

  it('maps stripe webhook events into lifecycle updates', () => {
    expect(resolveStripeBillingLifecycleUpdate({ type: 'checkout.session.completed', data: { object: { customer: 'cus_1', id: 'sub_1' } } })).toEqual({
      status: 'active',
      paymentProvider: 'stripe',
      paymentCustomerId: 'cus_1',
      paymentSubscriptionId: 'sub_1',
    })

    expect(resolveStripeBillingLifecycleUpdate({ type: 'customer.subscription.updated', data: { object: { customer: 'cus_1', id: 'sub_1', status: 'past_due' } } })).toEqual({
      status: 'past_due',
      paymentProvider: 'stripe',
      paymentCustomerId: 'cus_1',
      paymentSubscriptionId: 'sub_1',
    })

    expect(resolveStripeBillingLifecycleUpdate({ type: 'customer.subscription.deleted', data: { object: { customer: 'cus_1', id: 'sub_1' } } })).toEqual({
      status: 'canceled',
      paymentProvider: 'stripe',
      paymentCustomerId: 'cus_1',
      paymentSubscriptionId: 'sub_1',
    })

    expect(resolveStripeBillingLifecycleUpdate({ type: 'invoice.payment_failed', data: { object: { customer: 'cus_1', subscription: 'sub_1' } } })).toEqual({
      status: 'past_due',
      paymentProvider: 'stripe',
      paymentCustomerId: 'cus_1',
      paymentSubscriptionId: 'sub_1',
    })
  })

  it('lists the covered stripe webhook events', () => {
    expect(getStripeWebhookCoverage()).toEqual([
      {
        event: 'checkout.session.completed',
        status: 'covered',
        description: 'Activates the subscription after hosted checkout completes.',
      },
      {
        event: 'customer.subscription.created',
        status: 'covered',
        description: 'Syncs a newly created subscription into the billing ledger.',
      },
      {
        event: 'customer.subscription.updated',
        status: 'covered',
        description: 'Keeps status, customer, and subscription IDs in sync.',
      },
      {
        event: 'customer.subscription.deleted',
        status: 'covered',
        description: 'Marks a subscription canceled when it is removed at Stripe.',
      },
      {
        event: 'invoice.payment_failed',
        status: 'covered',
        description: 'Moves the account into past_due when invoice payment fails.',
      },
    ])
  })
})
