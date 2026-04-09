import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getRequestAdminAccessMock = vi.fn()
const venueLeadMaybeSingleMock = vi.fn()
const venueLeadUpdateEqMock = vi.fn(() => ({ error: null }))
const venueLeadUpdateMock = vi.fn(() => ({ eq: venueLeadUpdateEqMock }))
const venueDraftUpsertMock = vi.fn(() => Promise.resolve({ error: null }))

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
        upsert: venueDraftUpsertMock,
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
  createServiceClientMock.mockClear()
  getRequestAdminAccessMock.mockResolvedValue({ source: 'live', username: 'stagesync-admin', userId: 'admin-1' })
})

describe('admin venue lead route', () => {
  it('updates the lead status and operator notes', async () => {
    venueLeadMaybeSingleMock.mockResolvedValue({
      data: { id: 'lead-1', company_name: 'The River House', contact_name: 'Ava', follow_up_queue: 'venue-sales-demo', status: 'new', operator_notes: null },
      error: null,
    })

    const { POST } = await loadRoute()
    const request = {
      formData: async () => {
        const formData = new FormData()
        formData.set('status', 'contacted')
        formData.set('followUpQueue', 'venue-sales-pricing')
        formData.set('operatorNotes', 'Spoke with the GM')
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
    expect(venueLeadUpdateEqMock).toHaveBeenCalledWith('id', 'lead-1')
  })

  it('creates a provisioning draft from a venue lead', async () => {
    venueLeadMaybeSingleMock.mockResolvedValue({
      data: { id: 'lead-2', company_name: 'Sunset Social', contact_name: 'Noah', follow_up_queue: 'venue-sales-demo', status: 'new', operator_notes: 'Initial note' },
      error: null,
    })

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
