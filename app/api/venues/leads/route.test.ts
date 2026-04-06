import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const createServiceClientMock = vi.fn()
const insertMock = vi.fn()

vi.mock('../../../../utils/supabase/service', () => ({
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
    url: 'https://example.com/api/venues/leads',
  } as unknown as NextRequest
}

beforeEach(() => {
  insertMock.mockReset()
  insertMock.mockResolvedValue({ error: null })
  createServiceClientMock.mockReset()
  createServiceClientMock.mockReturnValue({
    from: vi.fn(() => ({ insert: insertMock })),
  })
})

describe('venue leads route', () => {
  it('persists a qualified venue lead and routes it for follow-up', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest({
      companyName: 'Northside Tavern',
      contactName: 'Avery',
      email: 'avery@example.com',
      phone: '555-1000',
      city: 'Austin',
      roomsCount: '2',
      bandsCount: '6',
      interestLevel: 'demo',
      message: 'Looking for multi-room reporting.',
    }))

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://example.com/venues?leadNotice=submitted')
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      company_name: 'Northside Tavern',
      contact_name: 'Avery',
      email: 'avery@example.com',
      follow_up_queue: 'venue-sales-demo',
      status: 'new',
      source: 'request-demo',
    }))
  })

  it('redirects with a missing-fields notice when required fields are absent', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest({
      companyName: '',
      contactName: '',
      email: '',
      roomsCount: '',
      interestLevel: '',
    }))

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://example.com/venues?leadNotice=missing-fields')
  })
})
