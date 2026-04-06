import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const getTestLoginMock = vi.fn()
const getLiveBandAccessContextMock = vi.fn()
const createServiceClientMock = vi.fn()
const authGetUserMock = vi.fn()
const createServerClientMock = vi.fn(() => ({
  cookies: {
    getAll: () => [],
    setAll: vi.fn(),
  },
  auth: {
    getUser: authGetUserMock,
  },
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

vi.mock('../../../../lib/test-session', () => ({
  getTestSession: getTestSessionMock,
}))

vi.mock('../../../../lib/test-login-list', () => ({
  getTestLogin: getTestLoginMock,
}))

vi.mock('../../../../lib/band-access', () => ({
  getLiveBandAccessContext: getLiveBandAccessContextMock,
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

function stubBillingUrls(overrides: Partial<Record<'STAGESYNC_BILLING_CHECKOUT_URL' | 'STAGESYNC_BILLING_PORTAL_URL' | 'STAGESYNC_BILLING_INVOICES_URL', string | undefined>>) {
  vi.stubEnv('STAGESYNC_BILLING_CHECKOUT_URL', overrides.STAGESYNC_BILLING_CHECKOUT_URL)
  vi.stubEnv('STAGESYNC_BILLING_PORTAL_URL', overrides.STAGESYNC_BILLING_PORTAL_URL)
  vi.stubEnv('STAGESYNC_BILLING_INVOICES_URL', overrides.STAGESYNC_BILLING_INVOICES_URL)
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getTestLoginMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  createServiceClientMock.mockReset()
  authGetUserMock.mockReset()
  createServerClientMock.mockClear()
  createServiceClientMock.mockReturnValue({})
  getStripeBillingConfigMock.mockReturnValue({
    secretKey: null,
    webhookSecret: null,
    professionalPriceId: null,
  })
  createStripeClientMock.mockReset()
  vi.unstubAllEnvs()
})

describe('billing subscription route', () => {
  it('redirects band admins back to the account page with an upgrade notice placeholder', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'northside' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin' })
    stubBillingUrls({})

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('intent', 'upgrade')

    const request = {
      formData: async () => formData,
      url: 'https://example.com/api/billing/subscription',
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://example.com/band/account?subscriptionNotice=checkout-pending')
  })

  it('redirects downgrade intents with a portal placeholder notice', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'northside' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin' })
    stubBillingUrls({})

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('intent', 'downgrade')

    const request = {
      formData: async () => formData,
      url: 'https://example.com/api/billing/subscription',
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://example.com/band/account?subscriptionNotice=downgrade-pending')
  })


  it('redirects invoice access with a hosted invoices placeholder notice', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'northside' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin' })
    stubBillingUrls({})

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('intent', 'invoices')

    const request = {
      formData: async () => formData,
      url: 'https://example.com/api/billing/subscription',
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://example.com/band/account?subscriptionNotice=invoices-pending')
  })

  it('rejects unknown billing intents', async () => {
    getTestSessionMock.mockResolvedValue(null)
    getLiveBandAccessContextMock.mockResolvedValue({})
    stubBillingUrls({})

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('intent', 'nonsense')

    const request = {
      formData: async () => formData,
      url: 'https://example.com/api/billing/subscription',
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('redirects to hosted checkout and portal URLs when configured', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'northside' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin' })
    stubBillingUrls({
      STAGESYNC_BILLING_CHECKOUT_URL: 'https://billing.example.com/checkout',
      STAGESYNC_BILLING_PORTAL_URL: 'https://billing.example.com/portal',
      STAGESYNC_BILLING_INVOICES_URL: 'https://billing.example.com/invoices',
    })

    const { POST } = await loadRoute()

    const upgradeForm = new FormData()
    upgradeForm.set('intent', 'upgrade')
    const manageForm = new FormData()
    manageForm.set('intent', 'manage')
    const invoicesForm = new FormData()
    invoicesForm.set('intent', 'invoices')

    const request = (formData: FormData) => ({
      formData: async () => formData,
      url: 'https://example.com/api/billing/subscription',
      cookies: { getAll: () => [], set: vi.fn() },
    }) as unknown as NextRequest

    expect((await POST(request(upgradeForm))).headers.get('location')).toBe('https://billing.example.com/checkout')
    expect((await POST(request(manageForm))).headers.get('location')).toBe('https://billing.example.com/portal')
    expect((await POST(request(invoicesForm))).headers.get('location')).toBe('https://billing.example.com/invoices')
  })

  it('uses stripe checkout and billing portal when stripe config is present', async () => {
    getTestSessionMock.mockResolvedValue(null)
    getLiveBandAccessContextMock.mockResolvedValue({
      userId: 'user-1',
      username: 'northside',
      displayName: 'Northside',
      bandId: 'band-1',
      bandName: 'Northside',
      bandRole: 'admin',
    })
    getStripeBillingConfigMock.mockReturnValue({
      secretKey: 'sk_test_123',
      webhookSecret: 'whsec_123',
      professionalPriceId: 'price_123',
    })
    authGetUserMock.mockResolvedValue({ data: { user: { email: 'northside@example.com' } } })
    createServiceClientMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: 'account-1', payment_customer_id: 'cus_123' }, error: null }),
          }),
        }),
        update: vi.fn(),
      }),
    })
    createStripeClientMock.mockReturnValue({
      checkout: {
        sessions: {
          create: vi.fn(async () => ({ url: 'https://checkout.stripe.com/session/abc' })),
        },
      },
      billingPortal: {
        sessions: {
          create: vi.fn(async () => ({ url: 'https://billing.stripe.com/session/portal' })),
        },
      },
    })

    const { POST } = await loadRoute()

    const checkoutForm = new FormData()
    checkoutForm.set('intent', 'upgrade')
    const manageForm = new FormData()
    manageForm.set('intent', 'manage')

    const request = (formData: FormData) => ({
      formData: async () => formData,
      url: 'https://example.com/api/billing/subscription',
      cookies: { getAll: () => [], set: vi.fn() },
      headers: { get: () => null },
    }) as unknown as NextRequest

    expect((await POST(request(checkoutForm))).headers.get('location')).toBe('https://checkout.stripe.com/session/abc')
    expect((await POST(request(manageForm))).headers.get('location')).toBe('https://billing.stripe.com/session/portal')
  })
})
