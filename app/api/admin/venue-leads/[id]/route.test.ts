import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getRequestAdminAccessMock = vi.fn()
const venueLeadMaybeSingleMock = vi.fn()
const venueLeadUpdateEqMock = vi.fn(() => ({ error: null }))
const venueLeadUpdateMock = vi.fn(() => ({ eq: venueLeadUpdateEqMock }))
const venueDraftUpsertMock = vi.fn(() => Promise.resolve({ error: null }))
const venueDraftTrailMaybeSingleMock = vi.fn()
const venueTrailInsertMock = vi.fn(() => Promise.resolve({ error: null }))

const createServiceClientMock = vi.fn(() => ({
  from(table: string) {
    if (table === 'venue_leads') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: venueLeadMaybeSingleMock })),
          maybeSingle: venueLeadMaybeSingleMock,
        })),
        update: venueLeadUpdateMock,
      }
    }

    if (table === 'venue_provisioning_drafts') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: venueDraftTrailMaybeSingleMock })),
          maybeSingle: venueDraftTrailMaybeSingleMock,
        })),
        upsert: venueDraftUpsertMock,
      }
    }

    if (table === 'venue_provisioning_events') {
      return {
        insert: venueTrailInsertMock,
      }
    }

    return {}
  },
}))

vi.mock('../../../../../lib/admin-access', () => ({
  getRequestAdminAccess: getRequestAdminAccessMock,
}))

vi.mock('../../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  getRequestAdminAccessMock.mockReset()
  venueLeadMaybeSingleMock.mockReset()
  venueLeadUpdateEqMock.mockClear()
  venueLeadUpdateMock.mockClear()
  venueDraftUpsertMock.mockClear()
  venueDraftTrailMaybeSingleMock.mockReset()
  venueTrailInsertMock.mockClear()
  createServiceClientMock.mockClear()
  getRequestAdminAccessMock.mockResolvedValue({ source: 'live', username: 'stagesync-admin', userId: 'admin-1' })
})

describe('admin venue lead route', () => {
  it('updates the lead status and operator notes', async () => {
    venueLeadMaybeSingleMock.mockResolvedValue({
      data: { id: 'lead-1', company_name: 'The River House', contact_name: 'Ava', follow_up_queue: 'venue-sales-demo', status: 'new', operator_notes: null },
      error: null,
    })
    venueDraftTrailMaybeSingleMock.mockResolvedValue({ data: { id: 'draft-1' }, error: null })

    const { POST } = await loadRoute()
    const request = {
      formData: async () => {
        const formData = new FormData()
        formData.set('status', 'contacted')
        formData.set('followUpQueue', 'venue-sales-pricing')
        formData.set('operatorNotes', 'Spoke with the GM')
        formData.set('milestone', 'terms_reviewed')
        return formData
      },
      url: 'https://example.com/api/admin/venue-leads/lead-1',
    } as unknown as NextRequest

    const response = await POST(request, { params: Promise.resolve({ id: 'lead-1' }) })

    expect(response.status).toBe(303)
    expect(venueLeadUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'contacted',
        follow_up_queue: 'venue-sales-pricing',
        operator_notes: 'Spoke with the GM',
      })
    )
    expect(venueDraftUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        venue_lead_id: 'lead-1',
        company_name: 'The River House',
        contact_name: 'Ava',
        status: 'contacted',
        follow_up_queue: 'venue-sales-pricing',
        created_by: 'stagesync-admin',
      }),
      { onConflict: 'venue_lead_id' }
    )
    expect(venueTrailInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        venue_provisioning_draft_id: 'draft-1',
        venue_lead_id: 'lead-1',
        milestone: 'terms_reviewed',
        note: expect.stringContaining('Spoke with the GM'),
        created_by: 'stagesync-admin',
      })
    )
    expect(venueLeadUpdateEqMock).toHaveBeenCalledWith('id', 'lead-1')
  })

  it('creates a provisioning draft from a venue lead', async () => {
    venueLeadMaybeSingleMock.mockResolvedValue({
      data: { id: 'lead-2', company_name: 'Sunset Social', contact_name: 'Noah', follow_up_queue: 'venue-sales-demo', status: 'new', operator_notes: 'Initial note' },
      error: null,
    })
    venueDraftTrailMaybeSingleMock.mockResolvedValue({ data: { id: 'draft-2' }, error: null })

    const { POST } = await loadRoute()
    const request = {
      formData: async () => {
        const formData = new FormData()
        formData.set('action', 'create-draft')
        return formData
      },
      url: 'https://example.com/api/admin/venue-leads/lead-2',
    } as unknown as NextRequest

    const response = await POST(request, { params: Promise.resolve({ id: 'lead-2' }) })

    expect(response.status).toBe(303)
    expect(venueDraftUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        venue_lead_id: 'lead-2',
        company_name: 'Sunset Social',
        contact_name: 'Noah',
        status: 'draft',
        follow_up_queue: 'venue-sales-hot',
        created_by: 'stagesync-admin',
      }),
      { onConflict: 'venue_lead_id' }
    )
    expect(venueLeadUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'reviewing',
        follow_up_queue: 'venue-sales-hot',
        operator_notes: 'Initial note',
      })
    )
    expect(venueTrailInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        venue_provisioning_draft_id: 'draft-2',
        venue_lead_id: 'lead-2',
        milestone: 'drafted',
        note: expect.stringContaining('Initial note'),
        created_by: 'stagesync-admin',
      })
    )
  })

  it('rejects an invalid status', async () => {
    venueLeadMaybeSingleMock.mockResolvedValue({
      data: { id: 'lead-1', company_name: 'The River House', contact_name: 'Ava', follow_up_queue: 'venue-sales-demo', status: 'new', operator_notes: null },
      error: null,
    })

    const { POST } = await loadRoute()
    const request = {
      formData: async () => {
        const formData = new FormData()
        formData.set('status', 'bogus')
        return formData
      },
      url: 'https://example.com/api/admin/venue-leads/lead-1',
    } as unknown as NextRequest

    const response = await POST(request, { params: Promise.resolve({ id: 'lead-1' }) })

    expect(response.status).toBe(400)
  })
})
