import { resolveSubscriptionNoticeForIntent, type SubscriptionBillingIntent } from './subscription-sync'

export type HostedBillingConfig = {
  checkoutUrl?: string | null
  portalUrl?: string | null
  invoicesUrl?: string | null
}

export type HostedBillingRedirect = {
  url: string | null
  notice: string | null
}

function isAbsoluteUrl(value: string | null | undefined) {
  if (!value) {
    return false
  }

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function resolveHostedBillingRedirect(intent: SubscriptionBillingIntent, config: HostedBillingConfig): HostedBillingRedirect {
  switch (intent) {
    case 'upgrade':
      return {
        url: isAbsoluteUrl(config.checkoutUrl) ? config.checkoutUrl ?? null : null,
        notice: config.checkoutUrl ? null : resolveSubscriptionNoticeForIntent(intent),
      }
    case 'manage':
      return {
        url: isAbsoluteUrl(config.portalUrl) ? config.portalUrl ?? null : null,
        notice: config.portalUrl ? null : resolveSubscriptionNoticeForIntent(intent),
      }
    case 'invoices':
      return {
        url: isAbsoluteUrl(config.invoicesUrl) ? config.invoicesUrl ?? null : null,
        notice: config.invoicesUrl ? null : resolveSubscriptionNoticeForIntent(intent),
      }
    case 'downgrade':
      return {
        url: isAbsoluteUrl(config.portalUrl) ? config.portalUrl ?? null : null,
        notice: config.portalUrl ? null : resolveSubscriptionNoticeForIntent(intent),
      }
    case 'stay':
      return {
        url: null,
        notice: resolveSubscriptionNoticeForIntent(intent),
      }
  }
}
