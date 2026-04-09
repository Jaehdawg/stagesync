export type VenueProvisioningDraftStatus = 'draft' | 'review' | 'active' | 'archived'

export type VenueProvisioningDraftInput = {
  venueLeadId: string
  companyName: string
  contactName: string
  createdBy: string
  followUpQueue: string
  operatorNotes?: string | null
}

export type VenueProvisioningDraft = {
  venue_lead_id: string
  company_name: string
  contact_name: string
  status: VenueProvisioningDraftStatus
  follow_up_queue: string
  operator_notes: string | null
  created_by: string
}

export function buildVenueProvisioningDraft(input: VenueProvisioningDraftInput): VenueProvisioningDraft {
  const noteLines = [input.operatorNotes?.trim() || null, `Provisioning draft created by ${input.createdBy} on ${new Date().toISOString()}`].filter(Boolean)

  return {
    venue_lead_id: input.venueLeadId,
    company_name: input.companyName,
    contact_name: input.contactName,
    status: 'draft',
    follow_up_queue: input.followUpQueue,
    operator_notes: noteLines.length ? noteLines.join('\n') : null,
    created_by: input.createdBy,
  }
}
