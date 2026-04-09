import { describe, expect, it } from 'vitest'
import { getVenueProvisioningMilestoneOptions } from './venue-provisioning-trail'

describe('venue provisioning trail helpers', () => {
  it('exposes the milestone options in handoff order', () => {
    const options = getVenueProvisioningMilestoneOptions()

    expect(options.map((option) => option.milestone)).toEqual(['drafted', 'terms_reviewed', 'pricing_approved', 'activated'])
  })
})
