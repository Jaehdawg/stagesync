import { FREE_PLAN, PROFESSIONAL_PLAN, resolveSubscriptionState, type SubscriptionState } from './subscription'

export type BillingAccountSubscriptionRow = {
  status: string | null
  payment_provider: string | null
  payment_subscription_id: string | null
  free_shows_allocated: number
  free_shows_used: number
}

export type SubscriptionBillingIntent = 'upgrade' | 'manage' | 'downgrade' | 'stay'

export type SubscriptionSummaryLine = {
  label: string
  value: string
}

export type SubscriptionControlState = {
  current: SubscriptionState
  billingCycleLabel: string
  primaryActionLabel: string
  primaryActionIntent: SubscriptionBillingIntent
  secondaryActionLabel: string
  secondaryActionIntent: SubscriptionBillingIntent
  helperText: string
  summaryLines: SubscriptionSummaryLine[]
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

export function resolveSubscriptionNoticeForIntent(intent: SubscriptionBillingIntent) {
  switch (intent) {
    case 'upgrade':
      return 'checkout-pending'
    case 'manage':
      return 'portal-pending'
    case 'downgrade':
      return 'downgrade-pending'
    case 'stay':
      return 'no-change'
  }
}

function formatSubscriptionStatusLabel(status: string) {
  switch (status) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trialing'
    case 'grace':
      return 'Grace period'
    case 'past_due':
      return 'Past due'
    case 'canceled':
      return 'Canceled'
    case 'paused':
      return 'Paused'
    case 'suspended':
      return 'Suspended'
    default:
      return 'Not active'
  }
}

function formatSubscriptionRenewalLabel(plan: SubscriptionState['plan'], status: SubscriptionState['status']) {
  if (plan === FREE_PLAN) {
    return 'No renewal while free'
  }

  switch (status) {
    case 'active':
    case 'trialing':
    case 'grace':
    case 'past_due':
      return 'Renews monthly'
    case 'canceled':
      return 'Canceled at provider'
    case 'paused':
      return 'Paused at provider'
    case 'suspended':
      return 'Suspended by provider'
    default:
      return 'Not renewing'
  }
}

export function resolveSubscriptionControlState(row: BillingAccountSubscriptionRow | null | undefined): SubscriptionControlState {
  const current = resolveSubscriptionStateFromBillingAccount(row)
  const isProfessional = current.plan === 'professional'
  const freeShowsAllocated = row?.free_shows_allocated ?? 0
  const freeShowsUsed = row?.free_shows_used ?? 0
  const freeShowsRemaining = Math.max(freeShowsAllocated - freeShowsUsed, 0)

  return {
    current,
    billingCycleLabel: 'Monthly only',
    primaryActionLabel: isProfessional ? 'Open billing portal' : 'Start Professional checkout',
    primaryActionIntent: isProfessional ? 'manage' : 'upgrade',
    secondaryActionLabel: isProfessional ? 'Downgrade to Free' : 'Stay on Free',
    secondaryActionIntent: isProfessional ? 'downgrade' : 'stay',
    helperText: isProfessional
      ? 'Hosted checkout keeps payment data outside StageSync.'
      : 'Professional is delivered through hosted checkout when enabled.',
    summaryLines: [
      { label: 'Plan', value: current.label },
      { label: 'Access', value: formatSubscriptionStatusLabel(current.status) },
      { label: 'Billing period', value: 'Monthly' },
      { label: 'Renewal', value: formatSubscriptionRenewalLabel(current.plan, current.status) },
      { label: 'Free shows', value: freeShowsAllocated > 0 ? `${freeShowsRemaining} of ${freeShowsAllocated} remaining` : 'None configured' },
    ],
  }
}
