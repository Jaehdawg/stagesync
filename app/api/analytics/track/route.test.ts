import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const insertMock = vi.fn()
const createServiceClientMock = vi.fn(() => ({
  from: vi.fn(() => ({ insert: insertMock })),
}))

vi.mock('@/utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  insertMock.mockReset()
  insertMock.mockResolvedValue({ error: null })
  createServiceClientMock.mockClear()
})

describe('analytics track route', () => {
  it('stores a canonical analytics event', async () => {
    const { POST } = await loadRoute()
    const request = {
      json: async () => ({
        eventName: 'pricing.page.viewed',
        source: 'homepage',
        properties: { section: 'pricing' },
      }),
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      event_name: 'pricing.page.viewed',
      source: 'homepage',
      properties: { section: 'pricing' },
    }))
  })
})
