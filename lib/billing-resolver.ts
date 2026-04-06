import { buildBillingAccount, getFreeShowsRemaining, type BillingAccount, type BillingAccountStatus } from './billing'
import { normalizeSubscriptionPlan, normalizeSubscriptionStatus, type SubscriptionPlan, type SubscriptionProviderStatus } from './subscription'

export type BillingAuditEventName =
  | 'billing.account.created'
  | 'billing.account.updated'
  | 'billing.credit.purchased'
  | 'billing.credit.consumed'
  | 'billing.subscription.changed'
  | 'billing.status.changed'

export type BillingAuditEvent = {
  eventName: BillingAuditEventName
  bandId: string
  billingAccountId?: string | null
  actorRole: 'admin' | 'band' | 'singer' | 'system'
  actorUserId?: string | null
  entityType?: string | null
  entityId?: string | null
  details: Record<string, unknown>
  occurredAt: string
}

export type BillingEntitlementSnapshot = {
  plan: SubscriptionPlan
  status: SubscriptionProviderStatus | BillingAccountStatus
  freeShowsRemaining: number
  canPurchaseCredits: boolean
  hasActiveAccess: boolean
  needsAttention: boolean
  account: BillingAccount
}

export function resolveBillingEntitlementSnapshot(input: {
  bandId: string
  billingStatus?: string | null
  subscriptionPlan?: string | null
  subscriptionStatus?: string | null
  freeShowsAllocated?: number
  freeShowsUsed?: number
  paymentProvider?: string | null
  paymentCustomerId?: string | null
  paymentSubscriptionId?: string | null
}): BillingEntitlementSnapshot {
  const account = buildBillingAccount({
    bandId: input.bandId,
    status: normalizeBillingStatus(input.billingStatus),
    freeShowsAllocated: input.freeShowsAllocated,
    freeShowsUsed: input.freeShowsUsed,
    paymentProvider: input.paymentProvider,
    paymentCustomerId: input.paymentCustomerId,
    paymentSubscriptionId: input.paymentSubscriptionId,
  })

  const plan = normalizeSubscriptionPlan(input.subscriptionPlan)
  const status = normalizeSubscriptionStatus(input.subscriptionStatus)
  const freeShowsRemaining = getFreeShowsRemaining(account)
  const hasActiveAccess = account.status === 'active' || account.status === 'grace' || plan === 'professional' && (status === 'active' || status === 'trialing' || status === 'grace' || status === 'past_due')

  return {
    plan,
    status,
    freeShowsRemaining,
    canPurchaseCredits: freeShowsRemaining > 0 || hasActiveAccess,
    hasActiveAccess,
    needsAttention: account.status === 'past_due' || account.status === 'suspended' || status === 'past_due' || status === 'paused' || status === 'canceled',
    account,
  }
}

export function normalizeBillingStatus(status?: string | null): BillingAccountStatus {
  if (status === 'free' || status === 'active' || status === 'grace' || status === 'past_due' || status === 'suspended') {
    return status
  }
  return 'free'
}

export function getBillingAuditEventNames() {
  return [
    'billing.account.created',
    'billing.account.updated',
    'billing.credit.purchased',
    'billing.credit.consumed',
    'billing.subscription.changed',
    'billing.status.changed',
  ] as const
}

export function buildBillingAuditEvent(input: Omit<BillingAuditEvent, 'occurredAt'> & { occurredAt?: Date }) {
  return {
    ...input,
    occurredAt: (input.occurredAt ?? new Date()).toISOString(),
  } satisfies BillingAuditEvent
}
