export const PROFESSIONAL_PLAN = 'professional' as const
export const FREE_PLAN = 'free' as const

export type SubscriptionPlan = typeof FREE_PLAN | typeof PROFESSIONAL_PLAN

export type SubscriptionProviderStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'paused'

export type SubscriptionEntitlement = {
  plan: SubscriptionPlan
  status: SubscriptionProviderStatus
  hasProfessionalAccess: boolean
  canPurchaseCredits: boolean
  needsAttention: boolean
}

export function normalizeSubscriptionPlan(plan: string | null | undefined): SubscriptionPlan {
  return plan === PROFESSIONAL_PLAN ? PROFESSIONAL_PLAN : FREE_PLAN
}

export function normalizeSubscriptionStatus(status: string | null | undefined): SubscriptionProviderStatus {
  if (status === 'trialing' || status === 'active' || status === 'past_due' || status === 'canceled' || status === 'paused') {
    return status
  }

  return 'none'
}

export function resolveSubscriptionEntitlement(input: {
  plan?: string | null
  status?: string | null
}): SubscriptionEntitlement {
  const plan = normalizeSubscriptionPlan(input.plan)
  const status = normalizeSubscriptionStatus(input.status)

  const hasProfessionalAccess = plan === PROFESSIONAL_PLAN && (status === 'active' || status === 'trialing' || status === 'past_due')

  return {
    plan,
    status,
    hasProfessionalAccess,
    canPurchaseCredits: plan === FREE_PLAN || hasProfessionalAccess,
    needsAttention: plan === PROFESSIONAL_PLAN && (status === 'past_due' || status === 'canceled' || status === 'paused'),
  }
}
