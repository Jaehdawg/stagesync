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
const createStripeClientMock = vi.fn()
const getStripeBillingConfigMock = vi.fn()

vi.mock('../../../../lib/stripe-billing', async () => {
  const actual = await vi.importActual<typeof import('../../../../lib/stripe-billing')>('../../../../lib/stripe-billing')
  return {
    ...actual,
    createStripeClient: createStripeClientMock,
    getStripeBillingConfig: getStripeBillingConfigMock,
  }
})

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
  createStripeClientMock.mockReset()
  getStripeBillingConfigMock.mockReset()
  createServiceClientMock.mockReturnValue({
    from: () => ({
      update: updateMock,
    }),
  })
  getStripeBillingConfigMock.mockReturnValue({
    secretKey: null,
    webhookSecret: null,
    professionalPriceId: null,
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

  it('verifies stripe webhook signatures and applies stripe lifecycle updates', async () => {
    getStripeBillingConfigMock.mockReturnValue({
      secretKey: 'sk_test_123',
      webhookSecret: 'whsec_123',
      professionalPriceId: 'price_123',
    })
    createStripeClientMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => ({
          type: 'customer.subscription.updated',
          data: { object: { customer: 'cus_123', id: 'sub_123', status: 'past_due', metadata: { billing_account_id: 'account-1' } } },
        })),
      },
    })

    const { POST } = await loadRoute()
    const request = {
      text: async () => '{"id":"evt_123"}',
      headers: { get: () => 't=1,v1=abc' },
      cookies: { getAll: () => [], set: vi.fn() },
      json: async () => ({}) ,
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'past_due',
      payment_provider: 'stripe',
      payment_customer_id: 'cus_123',
      payment_subscription_id: 'sub_123',
      updated_at: expect.any(String),
    }))
  })
})
