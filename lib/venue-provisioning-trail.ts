export type VenueProvisioningMilestone = 'drafted' | 'terms_reviewed' | 'pricing_approved' | 'activated'

export type VenueProvisioningTrailEntry = {
  milestone: VenueProvisioningMilestone
  label: string
  detail: string
}

export function getVenueProvisioningMilestoneOptions(): VenueProvisioningTrailEntry[] {
  return [
    { milestone: 'drafted', label: 'Drafted', detail: 'Initial venue draft captured and handed off for review.' },
    { milestone: 'terms_reviewed', label: 'Terms reviewed', detail: 'Commercial terms or contract notes have been checked.' },
    { milestone: 'pricing_approved', label: 'Pricing approved', detail: 'Custom pricing or discounting has been approved internally.' },
    { milestone: 'activated', label: 'Activated', detail: 'Venue provisioning is complete and ready to operate.' },
  ]
}
