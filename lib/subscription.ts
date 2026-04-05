export const PROFESSIONAL_PLAN = 'professional' as const
export const FREE_PLAN = 'free' as const

export type SubscriptionPlan = typeof FREE_PLAN | typeof PROFESSIONAL_PLAN

export type SubscriptionProviderStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'grace'
  | 'past_due'
  | 'canceled'
  | 'paused'
  | 'suspended'

export type SubscriptionEntitlement = {
  plan: SubscriptionPlan
  status: SubscriptionProviderStatus
  hasProfessionalAccess: boolean
  canPurchaseCredits: boolean
  needsAttention: boolean
}

export type SubscriptionState = {
  plan: SubscriptionPlan
  status: SubscriptionProviderStatus
  billingCycle: 'monthly'
  label: string
  summary: string
}

export function normalizeSubscriptionPlan(plan: string | null | undefined): SubscriptionPlan {
  return plan === PROFESSIONAL_PLAN ? PROFESSIONAL_PLAN : FREE_PLAN
}

export function normalizeSubscriptionStatus(status: string | null | undefined): SubscriptionProviderStatus {
  if (status === 'trialing' || status === 'active' || status === 'grace' || status === 'past_due' || status === 'canceled' || status === 'paused' || status === 'suspended') {
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

  const hasProfessionalAccess = plan === PROFESSIONAL_PLAN && (status === 'active' || status === 'trialing' || status === 'past_due' || status === 'grace')

  return {
    plan,
    status,
    hasProfessionalAccess,
    canPurchaseCredits: plan === FREE_PLAN || hasProfessionalAccess,
    needsAttention: plan === PROFESSIONAL_PLAN && (status === 'grace' || status === 'past_due' || status === 'canceled' || status === 'paused' || status === 'suspended'),
  }
}

export function resolveSubscriptionState(input: {
  plan?: string | null
  status?: string | null
}): SubscriptionState {
  const entitlement = resolveSubscriptionEntitlement(input)

  const label = entitlement.plan === PROFESSIONAL_PLAN ? 'Professional' : 'Free'
  const summary = entitlement.plan === PROFESSIONAL_PLAN
    ? entitlement.hasProfessionalAccess
      ? entitlement.needsAttention
        ? 'Professional access needs attention.'
        : 'Professional access is active.'
      : 'Professional access is inactive.'
    : 'Free access is active.'

  return {
    plan: entitlement.plan,
    status: entitlement.status,
    billingCycle: 'monthly',
    label,
    summary,
  }
}
