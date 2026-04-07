import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const getRequestAdminAccessMock = vi.fn()
const createServiceClientMock = vi.fn()
const updateMock = vi.fn(() => ({
  eq: async () => ({ error: null }),
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

function makeRequest(fields: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value)
  }

  return {
    formData: async () => formData,
    url: 'https://example.com/api/admin/venue-leads/lead-1',
    cookies: { getAll: () => [], set: vi.fn() },
  } as unknown as NextRequest
}

beforeEach(() => {
  getRequestAdminAccessMock.mockReset()
  createServiceClientMock.mockReset()
  createServiceClientMock.mockReturnValue({
    from: () => ({
      update: updateMock,
    }),
  })
  updateMock.mockClear()
})

describe('admin venue leads route', () => {
  it('updates venue lead review fields', async () => {
    getRequestAdminAccessMock.mockResolvedValue({ source: 'live', username: 'albert' })
    const { POST } = await loadRoute()

    const response = await POST(makeRequest({
      action: 'update',
      status: 'qualified',
      operatorNotes: 'Ready for provisioning.',
      commercialTerms: 'Custom base price $499 / month.',
      followUpQueue: 'venue-sales-hot',
    }), { params: Promise.resolve({ id: 'lead-1' }) })

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://example.com/admin/venues')
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'qualified',
      operator_notes: 'Ready for provisioning.',
      commercial_terms: 'Custom base price $499 / month.',
      follow_up_queue: 'venue-sales-hot',
      updated_at: expect.any(String),
    }))
  })

  it('rejects invalid statuses', async () => {
    getRequestAdminAccessMock.mockResolvedValue({ source: 'live', username: 'albert' })
    const { POST } = await loadRoute()

    const response = await POST(makeRequest({
      action: 'update',
      status: 'broken',
    }), { params: Promise.resolve({ id: 'lead-1' }) })

    expect(response.status).toBe(400)
  })
})
