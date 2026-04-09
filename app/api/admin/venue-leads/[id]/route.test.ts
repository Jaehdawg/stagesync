import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getRequestAdminAccessMock = vi.fn()
const venueLeadMaybeSingleMock = vi.fn()
const venueLeadUpdateEqMock = vi.fn(() => ({ error: null }))
const venueLeadUpdateMock = vi.fn(() => ({ eq: venueLeadUpdateEqMock }))

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
  createServiceClientMock.mockClear()
  getRequestAdminAccessMock.mockResolvedValue({ source: 'live', username: 'stagesync-admin', userId: 'admin-1' })
})

describe('admin venue lead route', () => {
  it('updates the lead status and operator notes', async () => {
    venueLeadMaybeSingleMock.mockResolvedValue({
      data: { id: 'lead-1', follow_up_queue: 'venue-sales-demo', status: 'new', operator_notes: null },
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
    expect(venueLeadUpdateEqMock).toHaveBeenCalledWith('id', 'lead-1')
  })

  it('creates a provisioning draft from a venue lead', async () => {
    venueLeadMaybeSingleMock.mockResolvedValue({
      data: { id: 'lead-2', follow_up_queue: 'venue-sales-demo', status: 'new', operator_notes: 'Initial note' },
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
    expect(venueLeadUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'reviewing',
        follow_up_queue: 'venue-sales-hot',
        operator_notes: expect.stringContaining('Initial note'),
      })
    )
    expect(venueLeadUpdateMock.mock.calls[0][0].operator_notes).toContain('Provisioning draft created by stagesync-admin')
  })

  it('rejects an invalid status', async () => {
    venueLeadMaybeSingleMock.mockResolvedValue({
      data: { id: 'lead-1', follow_up_queue: 'venue-sales-demo', status: 'new', operator_notes: null },
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
