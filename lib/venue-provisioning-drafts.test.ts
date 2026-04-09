import { describe, expect, it, vi } from 'vitest'
import { buildVenueProvisioningDraft } from './venue-provisioning-drafts'

describe('venue provisioning drafts', () => {
  it('builds a draft record with seeded operator notes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-08T19:30:00.000Z'))

    const draft = buildVenueProvisioningDraft({
      venueLeadId: 'lead-1',
      companyName: 'The River House',
      contactName: 'Ava',
      createdBy: 'stagesync-admin',
      followUpQueue: 'venue-sales-hot',
      operatorNotes: 'Initial note',
    })

    expect(draft).toEqual({
      venue_lead_id: 'lead-1',
      company_name: 'The River House',
      contact_name: 'Ava',
      status: 'draft',
      follow_up_queue: 'venue-sales-hot',
      operator_notes: 'Initial note\nProvisioning draft created by stagesync-admin on 2026-04-08T19:30:00.000Z',
      created_by: 'stagesync-admin',
    })

    vi.useRealTimers()
  })
})
