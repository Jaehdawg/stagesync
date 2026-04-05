import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const createServiceClientMock = vi.fn()
const createServerClientMock = vi.fn(() => ({
  cookies: {
    getAll: () => [],
    setAll: vi.fn(),
  },
}))
const updateMock = vi.fn()
const eqMock = vi.fn(() => ({
  select: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ error: null }) })),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

vi.mock('../../../../lib/billing-lifecycle', async () => {
  const actual = await vi.importActual<typeof import('../../../../lib/billing-lifecycle')>('../../../../lib/billing-lifecycle')
  return actual
})

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  createServiceClientMock.mockReset()
  createServerClientMock.mockClear()
  updateMock.mockClear()
  eqMock.mockClear()
  createServiceClientMock.mockReturnValue({
    from: () => ({
      update: () => ({
        eq: (...args: any[]) => ({
          select: () => ({ maybeSingle: async () => ({ error: null }) }),
        }),
      }),
    }),
  })
})

describe('billing webhook route', () => {
  it('applies a minimal lifecycle update by billing account id', async () => {
    const { POST } = await loadRoute()
    const request = {
      json: async () => ({
        billingAccountId: 'account-1',
        status: 'past_due',
        paymentProvider: 'stripe',
        paymentCustomerId: 'cus_123',
        paymentSubscriptionId: 'sub_123',
      }),
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('rejects payloads with no lifecycle update', async () => {
    const { POST } = await loadRoute()
    const request = {
      json: async () => ({ status: 'trialing' }),
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
