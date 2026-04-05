import { FREE_PLAN, PROFESSIONAL_PLAN, resolveSubscriptionState, type SubscriptionState } from './subscription'

export type BillingAccountSubscriptionRow = {
  status: string | null
  payment_provider: string | null
  payment_subscription_id: string | null
  free_shows_allocated: number
  free_shows_used: number
}

export type SubscriptionControlState = {
  current: SubscriptionState
  billingCycleLabel: string
  primaryActionLabel: string
  secondaryActionLabel: string
  helperText: string
}

export function resolveSubscriptionStateFromBillingAccount(row: BillingAccountSubscriptionRow | null | undefined): SubscriptionState {
  const rawStatus = row?.status ?? null
  const hasSubscriptionRecord = Boolean(row?.payment_provider || row?.payment_subscription_id)
  const plan = rawStatus && rawStatus !== 'free' ? PROFESSIONAL_PLAN : hasSubscriptionRecord ? PROFESSIONAL_PLAN : FREE_PLAN

  return resolveSubscriptionState({
    plan,
    status: plan === PROFESSIONAL_PLAN ? rawStatus ?? 'active' : 'none',
  })
}

export function resolveSubscriptionControlState(row: BillingAccountSubscriptionRow | null | undefined): SubscriptionControlState {
  const current = resolveSubscriptionStateFromBillingAccount(row)
  const isProfessional = current.plan === 'professional'

  return {
    current,
    billingCycleLabel: 'Monthly only',
    primaryActionLabel: isProfessional ? 'Open billing portal' : 'Start Professional checkout',
    secondaryActionLabel: isProfessional ? 'Downgrade to Free' : 'Stay on Free',
    helperText: isProfessional
      ? 'Hosted checkout keeps payment data outside StageSync.'
      : 'Professional is delivered through hosted checkout when enabled.',
  }
}
