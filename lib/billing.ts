export const FREE_SHOWS_PER_BAND = 3
export const PAID_SHOW_WINDOW_HOURS = 24

export type BillingAccountStatus = 'free' | 'active' | 'grace' | 'past_due' | 'suspended'

export type BillingAccount = {
  bandId: string
  status: BillingAccountStatus
  freeShowsAllocated: number
  freeShowsUsed: number
  paymentProvider: string | null
  paymentCustomerId: string | null
  paymentSubscriptionId: string | null
}

export type BillingCreditLedgerEntryType =
  | 'free_show_allocation'
  | 'credit_purchase'
  | 'credit_consumed'
  | 'undo_grace_hold'
  | 'subscription_grant'
  | 'subscription_revocation'

export type BillingCreditLedgerEntry = {
  bandId: string
  eventId: string | null
  billingAccountId: string
  entryType: BillingCreditLedgerEntryType
  amount: number
  provider: string | null
  providerReference: string | null
  note: string | null
  createdAt: string
}

export type HostedPaymentBoundary = {
  provider: 'hosted'
  providerName: string
  customerId: string | null
  sessionId: string | null
  subscriptionId: string | null
  isOutsidePCI: true
}

export function buildBillingAccount(partial: Partial<BillingAccount> & { bandId: string }): BillingAccount {
  return {
    bandId: partial.bandId,
    status: partial.status ?? 'free',
    freeShowsAllocated: partial.freeShowsAllocated ?? FREE_SHOWS_PER_BAND,
    freeShowsUsed: partial.freeShowsUsed ?? 0,
    paymentProvider: partial.paymentProvider ?? null,
    paymentCustomerId: partial.paymentCustomerId ?? null,
    paymentSubscriptionId: partial.paymentSubscriptionId ?? null,
  }
}

export function getFreeShowsRemaining(account: Pick<BillingAccount, 'freeShowsAllocated' | 'freeShowsUsed'>) {
  return Math.max(account.freeShowsAllocated - account.freeShowsUsed, 0)
}

export function makeHostedPaymentBoundary(input: {
  providerName: string
  customerId?: string | null
  sessionId?: string | null
  subscriptionId?: string | null
}): HostedPaymentBoundary {
  return {
    provider: 'hosted',
    providerName: input.providerName,
    customerId: input.customerId ?? null,
    sessionId: input.sessionId ?? null,
    subscriptionId: input.subscriptionId ?? null,
    isOutsidePCI: true,
  }
}

export function isPaymentOutsidePCIBoundary(boundary: HostedPaymentBoundary) {
  return boundary.isOutsidePCI
}
