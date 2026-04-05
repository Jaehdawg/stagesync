import { describe, expect, it } from 'vitest'
import { resolveSubscriptionControlState, resolveSubscriptionStateFromBillingAccount, resolveSubscriptionNoticeForIntent } from './subscription-sync'

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
        status: 'active',
        payment_provider: 'stripe',
        payment_subscription_id: null,
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
        status: 'grace',
        payment_provider: 'stripe',
        payment_subscription_id: 'sub_123',
        free_shows_allocated: 3,
        free_shows_used: 1,
      })
    ).toEqual({
      plan: 'professional',
      status: 'grace',
      billingCycle: 'monthly',
      label: 'Professional',
      summary: 'Professional access needs attention.',
    })

    expect(
      resolveSubscriptionStateFromBillingAccount({
        status: 'suspended',
        payment_provider: 'stripe',
        payment_subscription_id: 'sub_123',
        free_shows_allocated: 3,
        free_shows_used: 1,
      })
    ).toEqual({
      plan: 'professional',
      status: 'suspended',
      billingCycle: 'monthly',
      label: 'Professional',
      summary: 'Professional access is inactive.',
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

  it('resolves a billing notice for each intent', () => {
    expect(resolveSubscriptionNoticeForIntent('upgrade')).toBe('checkout-pending')
    expect(resolveSubscriptionNoticeForIntent('manage')).toBe('portal-pending')
    expect(resolveSubscriptionNoticeForIntent('downgrade')).toBe('downgrade-pending')
    expect(resolveSubscriptionNoticeForIntent('stay')).toBe('no-change')
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
      primaryActionLabel: 'Open billing portal',
      primaryActionIntent: 'manage',
      secondaryActionLabel: 'Downgrade to Free',
      secondaryActionIntent: 'downgrade',
      helperText: 'Hosted checkout keeps payment data outside StageSync.',
      summaryLines: [
        { label: 'Plan', value: 'Professional' },
        { label: 'Access', value: 'Active' },
        { label: 'Billing period', value: 'Monthly' },
        { label: 'Renewal', value: 'Renews monthly' },
        { label: 'Free shows', value: '2 of 3 remaining' },
      ],
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
      primaryActionLabel: 'Start Professional checkout',
      primaryActionIntent: 'upgrade',
      secondaryActionLabel: 'Stay on Free',
      secondaryActionIntent: 'stay',
      helperText: 'Professional is delivered through hosted checkout when enabled.',
      summaryLines: [
        { label: 'Plan', value: 'Free' },
        { label: 'Access', value: 'Not active' },
        { label: 'Billing period', value: 'Monthly' },
        { label: 'Renewal', value: 'No renewal while free' },
        { label: 'Free shows', value: '3 of 3 remaining' },
      ],
    })
  })
})
