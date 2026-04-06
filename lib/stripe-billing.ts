import Stripe from 'stripe'
import { normalizeBillingLifecycleStatus, type BillingLifecycleUpdate } from './billing-lifecycle'
import { type SubscriptionBillingIntent } from './subscription-sync'

export type StripeBillingConfig = {
  secretKey: string | null
  webhookSecret: string | null
  professionalPriceId: string | null
}

export type StripeHostedCheckoutRequest = {
  bandId: string
  bandName: string
  customerEmail: string | null
  professionalPriceId: string
  successUrl: string
  cancelUrl: string
}

export type StripePortalRequest = {
  customerId: string
  returnUrl: string
}

export function getStripeBillingConfig(env: NodeJS.ProcessEnv = process.env): StripeBillingConfig {
  return {
    secretKey: env.STRIPE_SECRET_KEY ?? null,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET ?? null,
    professionalPriceId: env.STAGESYNC_PRO_MONTHLY_PRICE_ID ?? null,
  }
}

export function hasStripeCheckoutConfig(config: StripeBillingConfig) {
  return Boolean(config.secretKey && config.professionalPriceId)
}

export function buildStripeCheckoutRequest(input: StripeHostedCheckoutRequest) {
  return {
    mode: 'subscription' as const,
    line_items: [{ price: input.professionalPriceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail ?? undefined,
    metadata: {
      band_id: input.bandId,
      band_name: input.bandName,
      billing_source: 'stagesync',
    },
    subscription_data: {
      metadata: {
        band_id: input.bandId,
        band_name: input.bandName,
        billing_source: 'stagesync',
      },
    },
  }
}

export function buildStripePortalRequest(input: StripePortalRequest) {
  return {
    customer: input.customerId,
    return_url: input.returnUrl,
  }
}

export type StripeWebhookLikeEvent = {
  type?: string
  data?: {
    object?: {
      status?: string | null
      customer?: string | null
      id?: string | null
      subscription?: string | null
    }
  }
}

export function resolveStripeBillingLifecycleUpdate(event: StripeWebhookLikeEvent): BillingLifecycleUpdate | null {
  const object = event.data?.object ?? null
  const subscriptionId = object?.subscription ?? object?.id ?? null
  const customerId = object?.customer ?? null

  switch (event.type) {
    case 'checkout.session.completed':
      return {
        status: 'active',
        paymentProvider: 'stripe',
        paymentCustomerId: customerId,
        paymentSubscriptionId: subscriptionId,
      }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      return {
        status: normalizeBillingLifecycleStatus(object?.status ?? null) ?? 'active',
        paymentProvider: 'stripe',
        paymentCustomerId: customerId,
        paymentSubscriptionId: subscriptionId,
      }
    case 'customer.subscription.deleted':
      return {
        status: 'canceled',
        paymentProvider: 'stripe',
        paymentCustomerId: customerId,
        paymentSubscriptionId: subscriptionId,
      }
    case 'invoice.payment_failed':
      return {
        status: 'past_due',
        paymentProvider: 'stripe',
        paymentCustomerId: customerId,
        paymentSubscriptionId: subscriptionId,
      }
    default:
      return null
  }
}

export function createStripeClient(secretKey: string) {
  return new Stripe(secretKey)
}

export type StripeBillingIntent = SubscriptionBillingIntent
