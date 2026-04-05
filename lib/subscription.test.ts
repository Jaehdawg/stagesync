import { describe, expect, it } from 'vitest'
import {
  FREE_PLAN,
  PROFESSIONAL_PLAN,
  normalizeSubscriptionPlan,
  normalizeSubscriptionStatus,
  resolveSubscriptionEntitlement,
  resolveSubscriptionState,
} from './subscription'

describe('subscription helpers', () => {
  it('normalizes the plan to free or professional', () => {
    expect(normalizeSubscriptionPlan(undefined)).toBe(FREE_PLAN)
    expect(normalizeSubscriptionPlan('professional')).toBe(PROFESSIONAL_PLAN)
    expect(normalizeSubscriptionPlan('anything-else')).toBe(FREE_PLAN)
  })

  it('normalizes provider status into the supported set', () => {
    expect(normalizeSubscriptionStatus(undefined)).toBe('none')
    expect(normalizeSubscriptionStatus('active')).toBe('active')
    expect(normalizeSubscriptionStatus('trialing')).toBe('trialing')
    expect(normalizeSubscriptionStatus('past_due')).toBe('past_due')
    expect(normalizeSubscriptionStatus('unexpected')).toBe('none')
  })

  it('resolves professional access and attention states from plan and status', () => {
    expect(resolveSubscriptionEntitlement({ plan: 'professional', status: 'active' })).toEqual({
      plan: 'professional',
      status: 'active',
      hasProfessionalAccess: true,
      canPurchaseCredits: true,
      needsAttention: false,
    })

    expect(resolveSubscriptionEntitlement({ plan: 'professional', status: 'past_due' })).toEqual({
      plan: 'professional',
      status: 'past_due',
      hasProfessionalAccess: true,
      canPurchaseCredits: true,
      needsAttention: true,
    })

    expect(resolveSubscriptionEntitlement({ plan: 'free', status: 'none' })).toEqual({
      plan: 'free',
      status: 'none',
      hasProfessionalAccess: false,
      canPurchaseCredits: true,
      needsAttention: false,
    })
  })

  it('resolves a displayable subscription state summary', () => {
    expect(resolveSubscriptionState({ plan: 'professional', status: 'active' })).toEqual({
      plan: 'professional',
      status: 'active',
      billingCycle: 'monthly',
      label: 'Professional',
      summary: 'Professional access is active.',
    })

    expect(resolveSubscriptionState({ plan: 'professional', status: 'past_due' })).toEqual({
      plan: 'professional',
      status: 'past_due',
      billingCycle: 'monthly',
      label: 'Professional',
      summary: 'Professional access needs attention.',
    })

    expect(resolveSubscriptionState({ plan: 'free', status: 'none' })).toEqual({
      plan: 'free',
      status: 'none',
      billingCycle: 'monthly',
      label: 'Free',
      summary: 'Free access is active.',
    })

    expect(resolveSubscriptionState({ plan: 'professional', status: 'canceled' })).toEqual({
      plan: 'professional',
      status: 'canceled',
      billingCycle: 'monthly',
      label: 'Professional',
      summary: 'Professional access is inactive.',
    })
  })
})
