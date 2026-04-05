import { resolveSubscriptionState, type SubscriptionState } from './subscription'

export type BillingAccountSubscriptionRow = {
  status: string | null
  payment_provider: string | null
  payment_subscription_id: string | null
  free_shows_allocated: number
  free_shows_used: number
}

export type SubscriptionControlState = {
  current: SubscriptionState
  primaryActionLabel: string
  secondaryActionLabel: string
  helperText: string
}

export function resolveSubscriptionStateFromBillingAccount(row: BillingAccountSubscriptionRow | null | undefined): SubscriptionState {
  const plan = row?.payment_subscription_id ? 'professional' : 'free'

  return resolveSubscriptionState({
    plan,
    status: row?.status,
  })
}

export function resolveSubscriptionControlState(row: BillingAccountSubscriptionRow | null | undefined): SubscriptionControlState {
  const current = resolveSubscriptionStateFromBillingAccount(row)
  const isProfessional = current.plan === 'professional'

  return {
    current,
    primaryActionLabel: isProfessional ? 'Manage Professional' : 'Upgrade to Professional',
    secondaryActionLabel: isProfessional ? 'Downgrade to Free' : 'Stay on Free',
    helperText: isProfessional
      ? 'Subscription state is synced from hosted checkout data.'
      : 'Professional subscription is available through hosted checkout when enabled.',
  }
}
