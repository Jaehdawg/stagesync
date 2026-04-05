import { describe, expect, it } from 'vitest'
import { resolveSubscriptionControlState, resolveSubscriptionStateFromBillingAccount } from './subscription-sync'

describe('subscription sync helpers', () => {
  it('maps a billing account row into a subscription state', () => {
    expect(
      resolveSubscriptionStateFromBillingAccount({
        status: 'active',
        payment_provider: 'stripe',
        payment_subscription_id: 'sub_123',
        free_shows_allocated: 3,
        free_shows_used: 1,
      })
    ).toEqual({
      plan: 'professional',
      status: 'active',
      billingCycle: 'monthly',
      label: 'Professional',
      summary: 'Professional access is active.',
    })

    expect(
      resolveSubscriptionStateFromBillingAccount({
        status: 'past_due',
        payment_provider: 'stripe',
        payment_subscription_id: 'sub_123',
        free_shows_allocated: 3,
        free_shows_used: 1,
      })
    ).toEqual({
      plan: 'professional',
      status: 'past_due',
      billingCycle: 'monthly',
      label: 'Professional',
      summary: 'Professional access needs attention.',
    })

    expect(
      resolveSubscriptionStateFromBillingAccount({
        status: 'free',
        payment_provider: null,
        payment_subscription_id: null,
        free_shows_allocated: 3,
        free_shows_used: 0,
      })
    ).toEqual({
      plan: 'free',
      status: 'none',
      billingCycle: 'monthly',
      label: 'Free',
      summary: 'Free access is active.',
    })
  })

  it('provides upgrade and downgrade control labels from the current subscription state', () => {
    expect(
      resolveSubscriptionControlState({
        status: 'active',
        payment_provider: 'stripe',
        payment_subscription_id: 'sub_123',
        free_shows_allocated: 3,
        free_shows_used: 1,
      })
    ).toEqual({
      current: {
        plan: 'professional',
        status: 'active',
        billingCycle: 'monthly',
        label: 'Professional',
        summary: 'Professional access is active.',
      },
      billingCycleLabel: 'Monthly only',
      primaryActionLabel: 'Manage Professional',
      secondaryActionLabel: 'Downgrade to Free',
      helperText: 'Subscription state is synced from hosted checkout data.',
    })

    expect(
      resolveSubscriptionControlState({
        status: 'free',
        payment_provider: null,
        payment_subscription_id: null,
        free_shows_allocated: 3,
        free_shows_used: 0,
      })
    ).toEqual({
      current: {
        plan: 'free',
        status: 'none',
        billingCycle: 'monthly',
        label: 'Free',
        summary: 'Free access is active.',
      },
      billingCycleLabel: 'Monthly only',
      primaryActionLabel: 'Upgrade to Professional',
      secondaryActionLabel: 'Stay on Free',
      helperText: 'Professional subscription is available through hosted checkout when enabled.',
    })
  })
})
