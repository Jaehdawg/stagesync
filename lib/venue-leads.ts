export type VenueLeadInterestLevel = 'explore' | 'demo' | 'pricing' | 'ready'

export type VenueLeadQuestion = {
  name: string
  label: string
  required: boolean
  hint?: string
}

export function getVenueLeadQuestions(): VenueLeadQuestion[] {
  return [
    { name: 'companyName', label: 'Venue / company name', required: true, hint: 'The public-facing venue or operator name.' },
    { name: 'contactName', label: 'Primary contact name', required: true, hint: 'Who should we reach out to first?' },
    { name: 'email', label: 'Email', required: true, hint: 'Best email for demo and follow-up.' },
    { name: 'phone', label: 'Phone', required: false, hint: 'Optional, for direct sales follow-up.' },
    { name: 'city', label: 'City / region', required: false, hint: 'Where the venue operates.' },
    { name: 'roomsCount', label: 'Rooms / stages', required: true, hint: 'How many spaces need reporting or operator access?' },
    { name: 'bandsCount', label: 'Bands you manage', required: false, hint: 'Approximate number of resident or rotating bands.' },
    { name: 'interestLevel', label: 'Current interest', required: true, hint: 'Helps route the lead to the right internal workflow.' },
    { name: 'message', label: 'Notes', required: false, hint: 'Anything else we should know about the venue.' },
  ]
}

export function getVenueLeadInterestOptions(): { label: string; value: VenueLeadInterestLevel }[] {
  return [
    { label: 'Just exploring', value: 'explore' },
    { label: 'Want a demo', value: 'demo' },
    { label: 'Need pricing', value: 'pricing' },
    { label: 'Ready to review', value: 'ready' },
  ]
}

export function getVenueLeadStatusMessage(notice?: string | null) {
  switch (notice) {
    case 'submitted':
      return 'Thanks — your venue inquiry was saved and routed for follow-up.'
    case 'missing-fields':
      return 'Please fill in the required venue inquiry fields before sending the request.'
    default:
      return null
  }
}

export function getVenueLeadFollowUpQueue(interestLevel: VenueLeadInterestLevel) {
  switch (interestLevel) {
    case 'ready':
      return 'venue-sales-hot'
    case 'pricing':
      return 'venue-sales-pricing'
    case 'demo':
      return 'venue-sales-demo'
    case 'explore':
      return 'venue-sales-nurture'
  }
}
