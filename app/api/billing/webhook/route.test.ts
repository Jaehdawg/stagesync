import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const createServiceClientMock = vi.fn()
const createServerClientMock = vi.fn(() => ({
  cookies: {
    getAll: () => [],
    setAll: vi.fn(),
  },
}))
const updateMock = vi.fn(() => ({
  eq: () => ({
    select: () => ({ maybeSingle: async () => ({ error: null }) }),
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('../../../../utils/supabase/service', () => ({
  createServiceClient: createServiceClientMock,
}))

async function loadRoute() {
  return await import('./route')
}

beforeEach(() => {
  createServiceClientMock.mockReset()
  createServerClientMock.mockClear()
  createServiceClientMock.mockReturnValue({
    from: () => ({
      update: updateMock,
    }),
  })
  updateMock.mockClear()
})

describe('billing webhook route', () => {
  it('applies a minimal lifecycle update by billing account id', async () => {
    const { POST } = await loadRoute()
    const request = {
      json: async () => ({
        billingAccountId: 'account-1',
        status: 'trialing',
        paymentProvider: 'stripe',
        paymentCustomerId: 'cus_123',
        paymentSubscriptionId: 'sub_123',
      }),
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'trialing',
      payment_provider: 'stripe',
      payment_customer_id: 'cus_123',
      payment_subscription_id: 'sub_123',
      updated_at: expect.any(String),
    }))
  })

  it('applies a lifecycle update by band id', async () => {
    const { POST } = await loadRoute()
    const request = {
      json: async () => ({
        bandId: 'band-1',
        status: 'canceled',
        paymentProvider: 'stripe',
        paymentSubscriptionId: 'sub_999',
      }),
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'canceled',
      payment_provider: 'stripe',
      payment_subscription_id: 'sub_999',
      updated_at: expect.any(String),
    }))
  })

  it('rejects payloads with no lifecycle update', async () => {
    const { POST } = await loadRoute()
    const request = {
      json: async () => ({ status: 'trial' }),
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
