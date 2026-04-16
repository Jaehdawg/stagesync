import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const isBandAdminRequestMock = vi.fn()
const queueMaybeSingleMock = vi.fn()
const queueUpdateEqMock = vi.fn()

const createServiceClientMock = vi.fn(() => ({
  from: vi.fn((table: string) => {
    if (table === 'queue_items') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: queueMaybeSingleMock,
          }),
        }),
        update: () => ({
          eq: queueUpdateEqMock,
        }),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  }),
}))

vi.mock('@/utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('@/lib/band-auth', () => ({
  isBandAdminRequest: isBandAdminRequestMock,
}))

async function loadRoute() {
  return await import('./route')
}

function makeRequest(action: string) {
  return {
    formData: async () => {
      const form = new FormData()
      form.append('action', action)
      return form
    },
    cookies: {
      getAll: () => [],
      set: vi.fn(),
    },
    headers: new Headers(),
    url: 'https://example.com/api/queue/item-1/state',
  } as unknown as NextRequest
}

beforeEach(() => {
  isBandAdminRequestMock.mockReset()
  queueMaybeSingleMock.mockReset()
  queueUpdateEqMock.mockReset()
  createServiceClientMock.mockClear()
})

describe('queue item state route', () => {
  it('approves requested queue items', async () => {
    isBandAdminRequestMock.mockResolvedValue(true)
    queueMaybeSingleMock.mockResolvedValue({ data: { id: 'item-1', band_id: 'band-1', event_id: 'show-1', position: 1 }, error: null })
    queueUpdateEqMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const response = await POST(makeRequest('approve'), { params: Promise.resolve({ id: 'item-1' }) })

    expect(response.status).toBe(200)
    expect(queueUpdateEqMock).toHaveBeenCalledWith('id', 'item-1')
  })

  it('denies requested queue items', async () => {
    isBandAdminRequestMock.mockResolvedValue(true)
    queueMaybeSingleMock.mockResolvedValue({ data: { id: 'item-1', band_id: 'band-1', event_id: 'show-1', position: 1 }, error: null })
    queueUpdateEqMock.mockResolvedValue({ error: null })

    const { POST } = await loadRoute()
    const response = await POST(makeRequest('deny'), { params: Promise.resolve({ id: 'item-1' }) })

    expect(response.status).toBe(200)
    expect(queueUpdateEqMock).toHaveBeenCalledWith('id', 'item-1')
  })
})
