export type VenueStatus = 'draft' | 'review' | 'active' | 'paused' | 'suspended' | 'closed'

export type VenueProvisioningStep = {
  title: string
  detail: string
}

export type VenuePricingControl = {
  title: string
  detail: string
}

export type VenueConfigurationPrimitive = {
  title: string
  detail: string
}

export type VenueProvisioningPlan = {
  flow: VenueProvisioningStep[]
  pricing: VenuePricingControl[]
  lifecycle: { status: VenueStatus; meaning: string }[]
  primitives: VenueConfigurationPrimitive[]
}

export function getVenueProvisioningPlan(): VenueProvisioningPlan {
  return {
    flow: [
      { title: 'Create venue draft', detail: 'Capture the venue name, rooms, and owner/operator contacts before turning anything live.' },
      { title: 'Review setup', detail: 'Confirm room counts, band assignments, and any custom commercial terms before activation.' },
      { title: 'Activate access', detail: 'Move the venue into service once operators and support agree the setup is complete.' },
      { title: 'Operate and review', detail: 'Keep the venue in an observable state so support can adjust room or band assignments later.' },
    ],
    pricing: [
      { title: 'Custom base price', detail: 'Assign a custom venue price when a standard tier does not fit the account.' },
      { title: 'Discount control', detail: 'Apply venue-specific discounts for pilots, multi-room deployments, or long-term partners.' },
      { title: 'Term overrides', detail: 'Tie pricing changes to custom terms so finance and support know why the price differs.' },
    ],
    lifecycle: [
      { status: 'draft', meaning: 'Venue exists but is not visible to operators or bands yet.' },
      { status: 'review', meaning: 'Internal team is validating the setup and commercial terms.' },
      { status: 'active', meaning: 'Venue is live and ready for bands and rooms to operate.' },
      { status: 'paused', meaning: 'Access is temporarily paused while issues are resolved.' },
      { status: 'suspended', meaning: 'Venue is blocked until billing, compliance, or support issues are fixed.' },
      { status: 'closed', meaning: 'Venue account has been retired and should be retained for reporting history only.' },
    ],
    primitives: [
      { title: 'Venue account', detail: 'The top-level account used for provisioning and lifecycle changes.' },
      { title: 'Room', detail: 'A separately reportable stage or space inside the venue.' },
      { title: 'Band assignment', detail: 'A relationship between a venue room and one or more bands.' },
      { title: 'Commercial terms', detail: 'The active pricing, discount, and contractual notes tied to the account.' },
    ],
  }
}
