import { describe, expect, it } from 'vitest'
import { buildBillingAuditEvent, getBillingAuditEventNames, resolveBillingEntitlementSnapshot } from './billing-resolver'

describe('billing resolver helpers', () => {
  it('resolves a canonical billing entitlement snapshot', () => {
    const snapshot = resolveBillingEntitlementSnapshot({
      bandId: 'band-1',
      billingStatus: 'active',
      subscriptionPlan: 'professional',
      subscriptionStatus: 'active',
      freeShowsAllocated: 3,
      freeShowsUsed: 1,
      paymentProvider: 'stripe',
      paymentCustomerId: 'cus_123',
      paymentSubscriptionId: 'sub_123',
    })

    expect(snapshot.plan).toBe('professional')
    expect(snapshot.hasActiveAccess).toBe(true)
    expect(snapshot.canPurchaseCredits).toBe(true)
    expect(snapshot.freeShowsRemaining).toBe(2)
  })

  it('builds append-only billing audit events', () => {
    const event = buildBillingAuditEvent({
      eventName: 'billing.credit.purchased',
      bandId: 'band-1',
      actorRole: 'admin',
      entityType: 'billing_accounts',
      entityId: 'billing-account-1',
      details: { amount: 1 },
    })

    expect(event.eventName).toBe('billing.credit.purchased')
    expect(event.occurredAt).toMatch(/T/)
    expect(event.details).toEqual({ amount: 1 })
  })

  it('lists the canonical audit event names', () => {
    expect(getBillingAuditEventNames()).toEqual(
      expect.arrayContaining([
        'billing.account.created',
        'billing.credit.purchased',
        'billing.subscription.changed',
      ])
    )
  })
})
