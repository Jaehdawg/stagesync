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

beforeEach(() => {
  getTestSessionMock.mockReset()
  getTestLoginMock.mockReset()
  getLiveBandAccessContextMock.mockReset()
  createServiceClientMock.mockReset()
  createServerClientMock.mockClear()
  createServiceClientMock.mockReturnValue({})
})

describe('billing subscription route', () => {
  it('redirects band admins back to the account page with an upgrade notice placeholder', async () => {
    getTestSessionMock.mockResolvedValue({ role: 'band', username: 'northside' })
    getTestLoginMock.mockResolvedValue({ role: 'band', band_access_level: 'admin' })

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

  it('rejects unknown billing intents', async () => {
    getTestSessionMock.mockResolvedValue(null)
    getLiveBandAccessContextMock.mockResolvedValue({})

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
})
