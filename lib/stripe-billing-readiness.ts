import { getStripeBillingConfig, hasStripeCheckoutConfig, type StripeBillingConfig } from './stripe-billing'

export type StripeBillingReadiness = {
  stripeCheckoutReady: boolean
  stripeWebhookReady: boolean
  hostedCheckoutReady: boolean
  hostedPortalReady: boolean
  hostedInvoicesReady: boolean
  missingStripeKeys: string[]
}

export function getStripeBillingReadiness(config: StripeBillingConfig = getStripeBillingConfig(), hostedUrls: { checkoutUrl?: string | null; portalUrl?: string | null; invoicesUrl?: string | null } = {}) : StripeBillingReadiness {
  const missingStripeKeys = [] as string[]

  if (!config.secretKey) missingStripeKeys.push('STRIPE_SECRET_KEY')
  if (!config.webhookSecret) missingStripeKeys.push('STRIPE_WEBHOOK_SECRET')
  if (!config.professionalPriceId) missingStripeKeys.push('STAGESYNC_PRO_MONTHLY_PRICE_ID')

  return {
    stripeCheckoutReady: hasStripeCheckoutConfig(config),
    stripeWebhookReady: Boolean(config.secretKey && config.webhookSecret),
    hostedCheckoutReady: Boolean(hostedUrls.checkoutUrl),
    hostedPortalReady: Boolean(hostedUrls.portalUrl),
    hostedInvoicesReady: Boolean(hostedUrls.invoicesUrl),
    missingStripeKeys,
  }
}
