export const BILLING_LIFECYCLE_STATUSES = ['free', 'active', 'grace', 'past_due', 'suspended'] as const

export type BillingLifecycleStatus = (typeof BILLING_LIFECYCLE_STATUSES)[number]

export type BillingLifecycleEvent = {
  billingAccountId?: string | null
  bandId?: string | null
  paymentProvider?: string | null
  paymentCustomerId?: string | null
  paymentSubscriptionId?: string | null
  status?: string | null
}

export type BillingLifecycleUpdate = {
  status?: BillingLifecycleStatus
  paymentProvider?: string | null
  paymentCustomerId?: string | null
  paymentSubscriptionId?: string | null
}

export function normalizeBillingLifecycleStatus(status: string | null | undefined): BillingLifecycleStatus | null {
  if (status === 'free' || status === 'active' || status === 'grace' || status === 'past_due' || status === 'suspended') {
    return status
  }

  return null
}

export function resolveBillingLifecycleUpdate(event: BillingLifecycleEvent): BillingLifecycleUpdate | null {
  const status = normalizeBillingLifecycleStatus(event.status)

  if (!status && !event.paymentSubscriptionId && !event.paymentCustomerId && !event.paymentProvider) {
    return null
  }

  return {
    status: status ?? undefined,
    paymentProvider: event.paymentProvider ?? undefined,
    paymentCustomerId: event.paymentCustomerId ?? undefined,
    paymentSubscriptionId: event.paymentSubscriptionId ?? undefined,
  }
}
