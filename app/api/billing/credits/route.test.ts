import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const getTestSessionMock = vi.fn()
const getTestLoginMock = vi.fn()
const getLiveBandAccessContextMock = vi.fn()
const createServiceClientMock = vi.fn()
const createServerClientMock = vi.fn(() => ({
  cookies: {
    getAll: () => [],
    setAll: vi.fn(),
  },
}))

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

function stubBillingUrls(overrides: Partial<Record<'STAGESYNC_CREDIT_CHECKOUT_URL' | 'STAGESYNC_CREDIT_RECEIPTS_URL', string | undefined>>) {
  vi.stubEnv('STAGESYNC_CREDIT_CHECKOUT_URL', overrides.STAGESYNC_CREDIT_CHECKOUT_URL)
  vi.stubEnv('STAGESYNC_CREDIT_RECEIPTS_URL', overrides.STAGESYNC_CREDIT_RECEIPTS_URL)
}

beforeEach(() => {
  getTestSessionMock.mockReset()
  getTestLoginMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  createServiceClientMock.mockReset()
  createServerClientMock.mockClear()
  createServiceClientMock.mockReturnValue({})
  vi.unstubAllEnvs()
})

describe('billing credits route', () => {
  it('redirects to a placeholder notice when purchase checkout is not configured', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'northside' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin' })
    stubBillingUrls({})

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('intent', 'purchase')
    formData.set('acknowledgeTerms', 'yes')

    const request = {
      formData: async () => formData,
      url: 'https://example.com/api/billing/credits',
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://example.com/band/account?creditNotice=credit-checkout-pending')
  })

  it('requires terms acknowledgment before purchase checkout', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'northside' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin' })
    stubBillingUrls({ STAGESYNC_CREDIT_CHECKOUT_URL: 'https://billing.example.com/checkout' })

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('intent', 'purchase')

    const request = {
      formData: async () => formData,
      url: 'https://example.com/api/billing/credits',
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://example.com/band/account?creditNotice=terms-required')
  })

  it('redirects to hosted receipts when configured', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'northside' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin' })
    stubBillingUrls({
      STAGESYNC_CREDIT_RECEIPTS_URL: 'https://billing.example.com/receipts',
    })

    const { POST } = await loadRoute()
    const formData = new FormData()
    formData.set('intent', 'receipts')

    const request = {
      formData: async () => formData,
      url: 'https://example.com/api/billing/credits',
      cookies: { getAll: () => [], set: vi.fn() },
    } as unknown as NextRequest

    const response = await POST(request)
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('https://billing.example.com/receipts')
  })
})
