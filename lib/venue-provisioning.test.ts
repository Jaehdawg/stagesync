import { describe, expect, it } from 'vitest'
import { getVenueProvisioningPlan } from './venue-provisioning'

describe('venue provisioning helpers', () => {
  it('defines the provisioning flow and lifecycle', () => {
    const plan = getVenueProvisioningPlan()

    expect(plan.flow[0].title).toBe('Create venue draft')
    expect(plan.pricing.some((item) => item.title === 'Discount control')).toBe(true)
    expect(plan.lifecycle.some((state) => state.status === 'active')).toBe(true)
    expect(plan.primitives.some((item) => item.title === 'Room')).toBe(true)
  })
})
